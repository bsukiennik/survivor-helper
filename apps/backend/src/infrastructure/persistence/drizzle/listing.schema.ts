import { doublePrecision, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

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
  employerName: text('employer_name').notNull(),
  // Free-text city/commune name shown alongside the map marker (FR2) — not
  // derived from latitude/longitude, so the two can drift; kept in sync by
  // whichever use case writes a Listing (seed.ts today, Epic 3 later).
  location: text('location').notNull(),
  description: text('description').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  status: listingStatusEnum('status').notNull().default('published'),
});
