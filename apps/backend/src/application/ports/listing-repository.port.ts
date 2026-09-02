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
  // Story 3.2 — this codebase's first write method on this port. Always
  // creates a `published` row (AD-12) — `PublishListingUseCase` is what
  // enforces the verification gate before calling this.
  create(input: {
    employerId: string;
    title: string;
    employerName: string;
    location: string;
    description: string;
    latitude: number;
    longitude: number;
    distributionRadiusKm: number;
  }): Promise<Listing>;
  // Story 3.2 — bulk `UPDATE ... SET status='archived' WHERE status =
  // 'published' AND createdAt < now() - 30 days`, a real status mutation
  // (never computed at query-time, per AD-12) run by the hourly `@Cron`
  // sweep. Returns the number of rows transitioned.
  archiveExpiredListings(): Promise<number>;
}

export const LISTING_REPOSITORY_PORT = Symbol('LISTING_REPOSITORY_PORT');
