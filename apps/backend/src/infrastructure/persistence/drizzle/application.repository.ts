import { Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import type {
  ApplicationRepositoryPort,
  MyApplicationRow,
} from '../../../application/ports/application-repository.port.js';
import type { Application } from '../../../domain/application/application.entity.js';
import { accountsTable } from './account.schema.js';
import { applicationsTable } from './application.schema.js';
import { getDb } from './db.js';
import { listingsTable } from './listing.schema.js';

@Injectable()
export class DrizzleApplicationRepository implements ApplicationRepositoryPort {
  // First transactional/row-lock use case in this codebase (Design Notes):
  // lock the Job Seeker's `accounts` row first (`FOR UPDATE`, serializing
  // concurrent catches by that Job Seeker — the lock Story 2.4 will reuse),
  // then insert-or-no-op inside the same transaction. `onConflictDoNothing`
  // targets the `UNIQUE(job_seeker_id, listing_id)` constraint, so a repeat
  // catch returns no row instead of erroring.
  async applyToListing(input: {
    jobSeekerId: string;
    listingId: string;
  }): Promise<{ application: Application; catchCount: number } | null> {
    return getDb().transaction(async (tx) => {
      await tx
        .select()
        .from(accountsTable)
        .where(eq(accountsTable.id, input.jobSeekerId))
        .for('update');

      const [row] = await tx
        .insert(applicationsTable)
        .values({ jobSeekerId: input.jobSeekerId, listingId: input.listingId })
        .onConflictDoNothing({
          target: [applicationsTable.jobSeekerId, applicationsTable.listingId],
        })
        .returning();

      if (!row) {
        return null;
      }

      // Story 2.4: recompute the authoritative catch count in the same
      // `tx`, right after the insert, still holding the account-row lock —
      // this is what serializes the 9th→10th unlock race (Design Notes).
      const [{ value: catchCount }] = await tx
        .select({ value: count() })
        .from(applicationsTable)
        .where(eq(applicationsTable.jobSeekerId, input.jobSeekerId));

      return { application: this.toDomain(row), catchCount };
    });
  }

  // Plain (non-transactional) count for `GET /me/badges` — same
  // count-query shape as the in-transaction one above, outside any
  // transaction/lock.
  async countByJobSeeker(jobSeekerId: string): Promise<number> {
    const [{ value }] = await getDb()
      .select({ value: count() })
      .from(applicationsTable)
      .where(eq(applicationsTable.jobSeekerId, jobSeekerId));
    return value;
  }

  // `GET /me/applications` (Story 2.5) — this codebase's first
  // `innerJoin`: Applications joined to their Listing, scoped strictly to
  // `jobSeekerId` (Boundaries & Constraints — never accepts an id from the
  // caller), newest first. Zero rows returns `[]`, not an error.
  async findByJobSeekerWithListing(jobSeekerId: string): Promise<MyApplicationRow[]> {
    return getDb()
      .select({
        id: applicationsTable.id,
        listingId: applicationsTable.listingId,
        listingTitle: listingsTable.title,
        employerName: listingsTable.employerName,
        status: applicationsTable.status,
        createdAt: applicationsTable.createdAt,
      })
      .from(applicationsTable)
      .innerJoin(listingsTable, eq(applicationsTable.listingId, listingsTable.id))
      .where(eq(applicationsTable.jobSeekerId, jobSeekerId))
      // `id` as a tiebreaker: `createdAt` alone isn't guaranteed unique
      // (same-millisecond inserts), so ordering by it alone risks a
      // non-deterministic "newest first" for near-simultaneous catches.
      .orderBy(desc(applicationsTable.createdAt), desc(applicationsTable.id));
  }

  private toDomain(row: typeof applicationsTable.$inferSelect): Application {
    return {
      id: row.id,
      jobSeekerId: row.jobSeekerId,
      listingId: row.listingId,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
