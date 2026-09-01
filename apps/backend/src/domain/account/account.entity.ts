/**
 * Domain entity — zero framework/infrastructure imports (AD-1).
 *
 * `role` is the single shared identity shape (AD-14) for every account kind
 * in the system. This story only ever creates `JobSeeker` accounts — the
 * other roles exist so the shape is stable for Story 3.1 (Employer) and the
 * Epic 5 admin-bootstrap path without a migration.
 */
export const ACCOUNT_ROLES = ['JobSeeker', 'Employer', 'Administrator'] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export interface Account {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: AccountRole;
  readonly createdAt: Date;
}
