import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { ApplicationRepositoryPort } from '../../../application/ports/application-repository.port.js';
import type { Application } from '../../../domain/application/application.entity.js';
import { accountsTable } from './account.schema.js';
import { applicationsTable } from './application.schema.js';
import { getDb } from './db.js';

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
  }): Promise<Application | null> {
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

      return row ? this.toDomain(row) : null;
    });
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
