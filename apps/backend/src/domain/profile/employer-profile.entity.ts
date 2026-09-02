/**
 * Domain entity — zero framework/infrastructure imports (AD-1).
 *
 * One row per Employer `accounts` row (1:1 via `accountId`, which is also
 * this table's primary key — same pattern as `job-seeker-profile.entity.ts`
 * / `job-seeker-profile.schema.ts`). `verificationStatus` starts `'pending'`
 * at registration; flipping it to `'verified'` is a manual admin action that
 * doesn't exist yet (Epic 5) — this story only ever changes it via seeded
 * data in tests. No `'rejected'` state (Boundaries & Constraints, Never).
 */
export const EMPLOYER_VERIFICATION_STATUSES = ['pending', 'verified'] as const;
export type EmployerVerificationStatus = (typeof EMPLOYER_VERIFICATION_STATUSES)[number];

export interface EmployerProfile {
  readonly accountId: string;
  readonly companyName: string;
  readonly verificationStatus: EmployerVerificationStatus;
}
