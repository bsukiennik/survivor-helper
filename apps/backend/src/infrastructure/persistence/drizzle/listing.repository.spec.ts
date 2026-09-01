import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { closeDb, getDb } from './db.js';
import { listingsTable } from './listing.schema.js';
import { DrizzleListingRepository } from './listing.repository.js';

/**
 * Integration test against a real Postgres — the unit-level controller/
 * use-case specs stub the repository port entirely, so the actual
 * `eq(status, 'published')` filter in `findPublished()` had zero coverage.
 *
 * Requires a reachable Postgres with the `listings` table migrated —
 * `docker compose up -d` (which runs the migration on boot) before
 * `pnpm --filter backend test` satisfies this; DATABASE_URL falls back to
 * docker-compose's published port when not already set.
 */

const TEST_PUBLISHED_ID = '99999999-9999-4999-8999-000000000001';
const TEST_ARCHIVED_ID = '99999999-9999-4999-8999-000000000002';
const TEST_REMOVED_ID = '99999999-9999-4999-8999-000000000003';
const TEST_IDS = [TEST_PUBLISHED_ID, TEST_ARCHIVED_ID, TEST_REMOVED_ID];

describe('DrizzleListingRepository (integration, real Postgres)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';

    const db = getDb();
    await db
      .insert(listingsTable)
      .values([
        {
          id: TEST_PUBLISHED_ID,
          title: '__test__ published listing',
          employerName: 'Test Co',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'published',
        },
        {
          id: TEST_ARCHIVED_ID,
          title: '__test__ archived listing',
          employerName: 'Test Co',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'archived',
        },
        {
          id: TEST_REMOVED_ID,
          title: '__test__ removed listing',
          employerName: 'Test Co',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'removed',
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(listingsTable).where(inArray(listingsTable.id, TEST_IDS));
    await closeDb();
  });

  it('returns only the published row among mixed-status rows', async () => {
    const repository = new DrizzleListingRepository();

    const results = await repository.findPublished();
    const resultIds = results.map((listing) => listing.id);

    expect(resultIds).toContain(TEST_PUBLISHED_ID);
    expect(resultIds).not.toContain(TEST_ARCHIVED_ID);
    expect(resultIds).not.toContain(TEST_REMOVED_ID);
    expect(results.every((listing) => listing.status === 'published')).toBe(true);
  });
});
