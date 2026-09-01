import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Shared identity shape (AD-14) — every account in the system, regardless of
// role, lives in this one table. Story 2.1 only ever inserts `JobSeeker`
// rows; the other values exist so the shape is stable for Story 3.1
// (Employer) and the Epic 5 admin-bootstrap path without a migration.
export const accountRoleEnum = pgEnum('account_role', [
  'JobSeeker',
  'Employer',
  'Administrator',
]);

export const accountsTable = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: accountRoleEnum('role').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
