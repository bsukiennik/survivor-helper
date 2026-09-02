import { doublePrecision, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { accountsTable } from './account.schema.js';

// Shared lifecycle enum (AD-12) — used by every path that changes a
// Listing's status. Only `published` rows are ever returned by the public
// read path in this story.
export const listingStatusEnum = pgEnum('listing_status', [
  'published',
  'archived',
  'lapsed',
  'removed',
]);

export const listingsTable = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  // Real FK (Story 3.2) — resolves the long-deferred "employerName is a
  // bare string" gap now that employer accounts exist, and is what Story
  // 3.4's triage ownership check will use.
  employerId: uuid('employer_id')
    .notNull()
    .references(() => accountsTable.id),
  employerName: text('employer_name').notNull(),
  // Free-text city/commune name shown alongside the map marker (FR2) — not
  // derived from latitude/longitude, so the two can drift; kept in sync by
  // whichever use case writes a Listing (seed.ts today, Epic 3 later).
  location: text('location').notNull(),
  description: text('description').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  // Standard tier's publish radius, capped at 10km at the DTO layer (Story
  // 3.2) — Premium has no defined parameters yet (Boundaries & Constraints).
  distributionRadiusKm: doublePrecision('distribution_radius_km').notNull(),
  status: listingStatusEnum('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
