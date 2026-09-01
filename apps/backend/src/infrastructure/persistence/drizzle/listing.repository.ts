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

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      employerName: row.employerName,
      location: row.location,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
    }));
  }
}
