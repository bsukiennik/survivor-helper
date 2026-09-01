import type { Application } from '../../domain/application/application.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 *
 * `applyToListing` is this codebase's first transactional/row-lock
 * operation (Design Notes): it row-locks the Job Seeker's `accounts` row
 * for the duration of one `db.transaction()` (serializing concurrent
 * catches by that Job Seeker — the lock Story 2.4 will reuse), then
 * inserts-or-no-ops on `UNIQUE(job_seeker_id, listing_id)`. Returns `null`
 * when the pair already existed (repeat catch), so the caller can tell
 * catch from re-catch without treating it as an error.
 */
export interface ApplicationRepositoryPort {
  applyToListing(input: { jobSeekerId: string; listingId: string }): Promise<Application | null>;
}

export const APPLICATION_REPOSITORY_PORT = Symbol('APPLICATION_REPOSITORY_PORT');
