/**
 * Domain entity — zero framework/infrastructure imports (AD-1).
 *
 * One row per (jobSeekerId, listingId) pair — `UNIQUE(job_seeker_id,
 * listing_id)` at the schema level is what makes a repeat "catch" a no-op
 * instead of a duplicate row (see `application.schema.ts`).
 *
 * `status` is inserted as `'submitted'` and never transitioned in this
 * story — Epic 3's triage use case (Story 3.4) is the only future
 * reader/writer of anything beyond that default.
 */
export interface Application {
  readonly id: string;
  readonly jobSeekerId: string;
  readonly listingId: string;
  readonly status: string;
  readonly createdAt: Date;
}
