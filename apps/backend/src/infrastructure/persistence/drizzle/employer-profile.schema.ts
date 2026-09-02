import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { accountsTable } from './account.schema.js';

// 1:1 with `accounts` (AD-14) — `accountId` is both the FK and the primary
// key, same pattern as `job_seeker_profiles`. Only `'pending'`/`'verified'`
// (Boundaries & Constraints, Never — no `'rejected'` state).
export const employerVerificationStatusEnum = pgEnum('employer_verification_status', [
  'pending',
  'verified',
]);

export const employerProfilesTable = pgTable('employer_profiles', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accountsTable.id),
  companyName: text('company_name').notNull(),
  verificationStatus: employerVerificationStatusEnum('verification_status')
    .notNull()
    .default('pending'),
});
