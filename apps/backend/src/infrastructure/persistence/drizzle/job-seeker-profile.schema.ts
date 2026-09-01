import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accountsTable } from './account.schema.js';

// 1:1 with `accounts` (AD-14) — `accountId` is both the FK and the primary
// key, which is what makes `upsert` in the repository adapter a plain
// `insert ... onConflictDoUpdate(target: accountId)` rather than a
// select-then-insert-or-update race.
export const jobSeekerProfilesTable = pgTable('job_seeker_profiles', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accountsTable.id),
  skills: text('skills').notNull(),
  experience: text('experience').notNull(),
  availability: text('availability').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
