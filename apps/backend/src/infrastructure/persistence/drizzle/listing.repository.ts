import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { ListingRepositoryPort } from '../../../application/ports/listing-repository.port.js';
import type { Listing } from '../../../domain/listing/listing.entity.js';
import { getDb } from './db.js';
import { listingsTable } from './listing.schema.js';

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

  private toDomain(row: typeof listingsTable.$inferSelect): Listing {
    return {
      id: row.id,
      title: row.title,
      employerName: row.employerName,
      location: row.location,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
    };
  }
}
