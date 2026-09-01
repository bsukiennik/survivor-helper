/**
 * Domain entity — zero framework/infrastructure imports (AD-1).
 *
 * One row per Job Seeker `accounts` row (1:1 via `accountId`, which is also
 * this table's primary key — see `job-seeker-profile.schema.ts`). No file
 * upload (CV, photo) in this story — free-text fields only.
 */
export interface JobSeekerProfile {
  readonly accountId: string;
  readonly skills: string;
  readonly experience: string;
  readonly availability: string;
  readonly updatedAt: Date;
}
