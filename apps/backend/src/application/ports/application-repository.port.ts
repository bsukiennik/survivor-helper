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
 *
 * On the created path, `catchCount` is the authoritative count of this Job
 * Seeker's Applications recomputed inside the same transaction — still
 * holding the account-row lock — right after the insert (Story 2.4 Design
 * Notes), which is what makes the 9th→10th unlock race-safe.
 */
export interface ApplicationRepositoryPort {
  applyToListing(input: {
    jobSeekerId: string;
    listingId: string;
  }): Promise<{ application: Application; catchCount: number } | null>;

  /**
   * Plain (non-transactional) count for the standalone `GET /me/badges`
   * view — reuses the same count-query shape as the in-transaction one in
   * `applyToListing`, but outside any transaction/lock.
   */
  countByJobSeeker(jobSeekerId: string): Promise<number>;
}

export const APPLICATION_REPOSITORY_PORT = Symbol('APPLICATION_REPOSITORY_PORT');
