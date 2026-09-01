import type { Listing } from '../../domain/listing/listing.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 */
export interface ListingRepositoryPort {
  findPublished(): Promise<Listing[]>;
}

export const LISTING_REPOSITORY_PORT = Symbol('LISTING_REPOSITORY_PORT');
