import { Injectable } from '@nestjs/common';
import { and, eq, lt } from 'drizzle-orm';
import type { ListingRepositoryPort } from '../../../application/ports/listing-repository.port.js';
import type { Listing } from '../../../domain/listing/listing.entity.js';
import { getDb } from './db.js';
import { listingsTable } from './listing.schema.js';

// 30 days, in milliseconds — the archival sweep's fixed lifetime (Story
// 3.2). Not configurable in this story (Boundaries & Constraints).
const ARCHIVE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class DrizzleListingRepository implements ListingRepositoryPort {
  async findPublished(): Promise<Listing[]> {
    const rows = await getDb()
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.status, 'published'));

    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Listing | null> {
    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);

    const row = rows[0];
    return row ? this.toDomain(row) : null;
  }

  // First write method on this port (Design Notes) — a plain insert, same
  // shape as `DrizzleApplicationRepository`'s non-transactional inserts.
  // No transaction needed: nothing else reads-then-writes this row.
  async create(input: {
    employerId: string;
    title: string;
    employerName: string;
    location: string;
    description: string;
    latitude: number;
    longitude: number;
    distributionRadiusKm: number;
  }): Promise<Listing> {
    const [row] = await getDb()
      .insert(listingsTable)
      .values({
        employerId: input.employerId,
        title: input.title,
        employerName: input.employerName,
        location: input.location,
        description: input.description,
        latitude: input.latitude,
        longitude: input.longitude,
        distributionRadiusKm: input.distributionRadiusKm,
        status: 'published',
      })
      .returning();

    return this.toDomain(row);
  }

  // Single bulk `UPDATE ... RETURNING`, not a select-then-loop (Design
  // Notes) — a real status mutation (AD-12), run hourly by the `@Cron`
  // sweep in `infrastructure/scheduling/listing-archival.scheduler.ts`.
  async archiveExpiredListings(): Promise<number> {
    const cutoff = new Date(Date.now() - ARCHIVE_AFTER_MS);

    const rows = await getDb()
      .update(listingsTable)
      .set({ status: 'archived' })
      .where(and(eq(listingsTable.status, 'published'), lt(listingsTable.createdAt, cutoff)))
      .returning({ id: listingsTable.id });

    return rows.length;
  }

  private toDomain(row: typeof listingsTable.$inferSelect): Listing {
    return {
      id: row.id,
      title: row.title,
      employerId: row.employerId,
      employerName: row.employerName,
      location: row.location,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      distributionRadiusKm: row.distributionRadiusKm,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
