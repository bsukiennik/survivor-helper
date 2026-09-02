import { and, eq, inArray, lt } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from './account.schema.js';
import { closeDb, getDb } from './db.js';
import { listingsTable } from './listing.schema.js';
import { DrizzleListingRepository } from './listing.repository.js';

/**
 * Integration test against a real Postgres — the unit-level controller/
 * use-case specs stub the repository port entirely, so the actual
 * `eq(status, 'published')` filter in `findPublished()`, the `create()`
 * insert, and the `archiveExpiredListings()` bulk update had zero coverage.
 *
 * Requires a reachable Postgres with the `listings` table migrated —
 * `docker compose up -d` (which runs the migration on boot) before
 * `pnpm --filter backend test` satisfies this; DATABASE_URL falls back to
 * docker-compose's published port when not already set.
 */

const TEST_EMPLOYER_ACCOUNT_ID = '99999999-9999-4999-8999-0000000000e0';
const TEST_EMPLOYER_EMAIL = '__test__listing-repository@example.com';

beforeAll(async () => {
  process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
  await getDb()
    .insert(accountsTable)
    .values({
      id: TEST_EMPLOYER_ACCOUNT_ID,
      email: TEST_EMPLOYER_EMAIL,
      passwordHash: 'irrelevant',
      role: 'Employer',
    })
    .onConflictDoNothing();
});

afterAll(async () => {
  await getDb().delete(accountsTable).where(eq(accountsTable.id, TEST_EMPLOYER_ACCOUNT_ID));
  await closeDb();
});

describe('DrizzleListingRepository.findPublished/findById (integration, real Postgres)', () => {
  const TEST_PUBLISHED_ID = '99999999-9999-4999-8999-000000000001';
  const TEST_ARCHIVED_ID = '99999999-9999-4999-8999-000000000002';
  const TEST_REMOVED_ID = '99999999-9999-4999-8999-000000000003';
  const TEST_IDS = [TEST_PUBLISHED_ID, TEST_ARCHIVED_ID, TEST_REMOVED_ID];

  beforeAll(async () => {
    const db = getDb();
    await db
      .insert(listingsTable)
      .values([
        {
          id: TEST_PUBLISHED_ID,
          employerId: TEST_EMPLOYER_ACCOUNT_ID,
          title: '__test__ published listing',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          distributionRadiusKm: 10,
          status: 'published',
        },
        {
          id: TEST_ARCHIVED_ID,
          employerId: TEST_EMPLOYER_ACCOUNT_ID,
          title: '__test__ archived listing',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          distributionRadiusKm: 10,
          status: 'archived',
        },
        {
          id: TEST_REMOVED_ID,
          employerId: TEST_EMPLOYER_ACCOUNT_ID,
          title: '__test__ removed listing',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          distributionRadiusKm: 10,
          status: 'removed',
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await getDb().delete(listingsTable).where(inArray(listingsTable.id, TEST_IDS));
  });

  it('returns only the published row among mixed-status rows', async () => {
    const repository = new DrizzleListingRepository();

    const results = await repository.findPublished();
    const resultIds = results.map((listing) => listing.id);

    expect(resultIds).toContain(TEST_PUBLISHED_ID);
    expect(resultIds).not.toContain(TEST_ARCHIVED_ID);
    expect(resultIds).not.toContain(TEST_REMOVED_ID);
    expect(results.every((listing) => listing.status === 'published')).toBe(true);

    const publishedResult = results.find((listing) => listing.id === TEST_PUBLISHED_ID);
    expect(publishedResult?.location).toBe('Testville');
  });

  it('findById finds a Listing regardless of status (Story 2.3 pre-transaction existence check)', async () => {
    const repository = new DrizzleListingRepository();

    const found = await repository.findById(TEST_ARCHIVED_ID);

    expect(found?.id).toBe(TEST_ARCHIVED_ID);
    expect(found?.status).toBe('archived');
  });

  it('findById returns null for an id that matches no row', async () => {
    const repository = new DrizzleListingRepository();

    const found = await repository.findById('99999999-9999-4999-8999-000000000000');

    expect(found).toBeNull();
  });
});

describe('DrizzleListingRepository.create (Story 3.2, integration, real Postgres)', () => {
  let createdId: string | undefined;

  afterEach(async () => {
    if (createdId) {
      await getDb().delete(listingsTable).where(eq(listingsTable.id, createdId));
      createdId = undefined;
    }
  });

  it('inserts a published Listing and returns it with a generated id/createdAt', async () => {
    const repository = new DrizzleListingRepository();

    const before = Date.now();
    const created = await repository.create({
      employerId: TEST_EMPLOYER_ACCOUNT_ID,
      title: '__test__ created listing',
      employerName: 'Test Co',
      location: 'Testville',
      description: 'created by listing.repository.spec.ts',
      latitude: 1.23,
      longitude: 4.56,
      distributionRadiusKm: 5,
    });
    createdId = created.id;

    expect(created.status).toBe('published');
    expect(created.employerId).toBe(TEST_EMPLOYER_ACCOUNT_ID);
    expect(created.distributionRadiusKm).toBe(5);
    expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(before);

    const found = await repository.findById(created.id);
    expect(found?.title).toBe('__test__ created listing');
  });
});

describe('DrizzleListingRepository.archiveExpiredListings (Story 3.2, integration, real Postgres)', () => {
  const OLD_ID = '99999999-9999-4999-8999-000000000201';
  const RECENT_ID = '99999999-9999-4999-8999-000000000202';
  const IDS = [OLD_ID, RECENT_ID];

  const THIRTY_ONE_DAYS_AGO = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  const FIVE_DAYS_AGO = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    await getDb()
      .insert(listingsTable)
      .values([
        {
          id: OLD_ID,
          employerId: TEST_EMPLOYER_ACCOUNT_ID,
          title: '__test__ old published listing',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          distributionRadiusKm: 10,
          status: 'published',
          createdAt: THIRTY_ONE_DAYS_AGO,
        },
        {
          id: RECENT_ID,
          employerId: TEST_EMPLOYER_ACCOUNT_ID,
          title: '__test__ recent published listing',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by listing.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          distributionRadiusKm: 10,
          status: 'published',
          createdAt: FIVE_DAYS_AGO,
        },
      ])
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await getDb().delete(listingsTable).where(inArray(listingsTable.id, IDS));
  });

  it('archives only the >30-day-old published Listing, leaving the recent one published', async () => {
    const repository = new DrizzleListingRepository();

    const archivedCount = await repository.archiveExpiredListings();

    expect(archivedCount).toBeGreaterThanOrEqual(1);

    const [oldRow] = await getDb().select().from(listingsTable).where(eq(listingsTable.id, OLD_ID));
    const [recentRow] = await getDb()
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, RECENT_ID));

    expect(oldRow?.status).toBe('archived');
    expect(recentRow?.status).toBe('published');

    const stillPublished = await repository.findPublished();
    expect(stillPublished.map((listing) => listing.id)).not.toContain(OLD_ID);
    expect(stillPublished.map((listing) => listing.id)).toContain(RECENT_ID);
  });

  it('is a real status mutation, not a query-time filter — a direct select still shows archived afterward', async () => {
    await new DrizzleListingRepository().archiveExpiredListings();

    const rows = await getDb()
      .select()
      .from(listingsTable)
      .where(and(eq(listingsTable.id, OLD_ID), lt(listingsTable.createdAt, FIVE_DAYS_AGO)));

    expect(rows[0]?.status).toBe('archived');
  });
});
