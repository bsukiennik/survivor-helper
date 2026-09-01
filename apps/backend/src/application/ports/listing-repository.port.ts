import type { Listing } from '../../domain/listing/listing.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 */
export interface ListingRepositoryPort {
  findPublished(): Promise<Listing[]>;
  // Story 2.3 — existence lookup for `ApplyToListingUseCase`'s pre-transaction
  // 404 check (any status, not just `published`; a Listing that lapsed after
  // being caught is still a real Listing).
  findById(id: string): Promise<Listing | null>;
}

export const LISTING_REPOSITORY_PORT = Symbol('LISTING_REPOSITORY_PORT');
