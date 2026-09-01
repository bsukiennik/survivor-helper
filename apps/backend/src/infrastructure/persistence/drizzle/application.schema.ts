import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { accountsTable } from './account.schema.js';
import { listingsTable } from './listing.schema.js';

// `UNIQUE(job_seeker_id, listing_id)` is the no-duplicate-catch invariant
// (Design Notes) — `DrizzleApplicationRepository.applyToListing`'s insert
// relies on this exact constraint via
// `onConflictDoNothing({ target: [jobSeekerId, listingId] })`.
export const applicationsTable = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobSeekerId: uuid('job_seeker_id')
      .notNull()
      .references(() => accountsTable.id),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listingsTable.id),
    // Epic 3's triage use case (Story 3.4) is the only future writer of
    // this column — this story only ever inserts the default, never
    // reads/transitions it.
    status: text('status').notNull().default('submitted'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.jobSeekerId, table.listingId)],
);
