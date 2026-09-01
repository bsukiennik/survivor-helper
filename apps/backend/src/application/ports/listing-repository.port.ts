import type { Listing } from '../../domain/listing/listing.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 */
export interface ListingRepositoryPort {
  findPublished(): Promise<Listing[]>;
  // Story 2.3 — generic existence lookup (any status), kept status-agnostic
  // at this layer so it stays reusable (e.g. future admin/employer tooling
  // that needs to look up a non-published Listing). `ApplyToListingUseCase`
  // is the one that enforces the "must be published to be catchable"
  // business rule on top of this — see its own comment.
  findById(id: string): Promise<Listing | null>;
}

export const LISTING_REPOSITORY_PORT = Symbol('LISTING_REPOSITORY_PORT');
