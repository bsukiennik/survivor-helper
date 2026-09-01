import type { JobSeekerProfile } from '../../domain/profile/job-seeker-profile.entity.js';

/**
 * Port (AD-1) — the domain/application layer depends on this interface only.
 * The concrete implementation lives behind `infrastructure/persistence/drizzle`.
 */
export interface JobSeekerProfileRepositoryPort {
  findByAccountId(accountId: string): Promise<JobSeekerProfile | null>;
  // Upsert, not insert-then-error — one row per account, created on first
  // save and overwritten on every later one.
  upsert(input: {
    accountId: string;
    skills: string;
    experience: string;
    availability: string;
  }): Promise<JobSeekerProfile>;
}

export const JOB_SEEKER_PROFILE_REPOSITORY_PORT = Symbol('JOB_SEEKER_PROFILE_REPOSITORY_PORT');
