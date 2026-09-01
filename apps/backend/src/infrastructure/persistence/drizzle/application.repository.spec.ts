import { eq, inArray } from 'drizzle-orm';
import { Client } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from './account.schema.js';
import { DrizzleApplicationRepository } from './application.repository.js';
import { applicationsTable } from './application.schema.js';
import { closeDb, getDb } from './db.js';
import { listingsTable } from './listing.schema.js';

/**
 * Integration test against a real Postgres — the unit-level use-case/
 * controller specs stub the repository port entirely, so the actual
 * row-lock-then-insert-or-no-op transaction (Design Notes) had zero
 * coverage.
 *
 * Requires a reachable Postgres with the `applications` table migrated —
 * `docker compose up -d` (which runs the migration on boot) before
 * `pnpm --filter backend test` satisfies this; DATABASE_URL falls back to
 * docker-compose's published port when not already set.
 */

const TEST_EMAIL = '__test__application-repository@example.com';
const TEST_LISTING_A = '99999999-9999-4999-8999-000000000101';
const TEST_LISTING_B = '99999999-9999-4999-8999-000000000102';
const TEST_LISTING_IDS = [TEST_LISTING_A, TEST_LISTING_B];

let testAccountId = '';

describe('DrizzleApplicationRepository (integration, real Postgres)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();

    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    const [account] = await db
      .insert(accountsTable)
      .values({ email: TEST_EMAIL, passwordHash: 'irrelevant', role: 'JobSeeker' })
      .returning();
    testAccountId = account.id;

    await db
      .insert(listingsTable)
      .values([
        {
          id: TEST_LISTING_A,
          title: '__test__ listing A',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by application.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'published',
        },
        {
          id: TEST_LISTING_B,
          title: '__test__ listing B',
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by application.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'published',
        },
      ])
      .onConflictDoNothing();
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(applicationsTable).where(eq(applicationsTable.jobSeekerId, testAccountId));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(applicationsTable).where(eq(applicationsTable.jobSeekerId, testAccountId));
    await db.delete(listingsTable).where(inArray(listingsTable.id, TEST_LISTING_IDS));
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    await closeDb();
  });

  it('creates an Application row on first catch', async () => {
    const repository = new DrizzleApplicationRepository();

    const created = await repository.applyToListing({
      jobSeekerId: testAccountId,
      listingId: TEST_LISTING_A,
    });

    expect(created).not.toBeNull();
    expect(created?.jobSeekerId).toBe(testAccountId);
    expect(created?.listingId).toBe(TEST_LISTING_A);
    expect(created?.status).toBe('submitted');

    const rows = await getDb()
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.jobSeekerId, testAccountId));
    expect(rows).toHaveLength(1);
  });

  it('returns null and inserts no second row on a repeat catch of the same pair', async () => {
    const repository = new DrizzleApplicationRepository();
    await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });

    const repeat = await repository.applyToListing({
      jobSeekerId: testAccountId,
      listingId: TEST_LISTING_A,
    });

    expect(repeat).toBeNull();
    const rows = await getDb()
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.jobSeekerId, testAccountId));
    expect(rows).toHaveLength(1);
  });

  it('serializes concurrent catches on different Listings by the same Job Seeker — both succeed, no lost update', async () => {
    const repository = new DrizzleApplicationRepository();

    const [resultA, resultB] = await Promise.all([
      repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A }),
      repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_B }),
    ]);

    expect(resultA).not.toBeNull();
    expect(resultB).not.toBeNull();
    const rows = await getDb()
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.jobSeekerId, testAccountId));
    const listingIds = rows.map((row) => row.listingId).sort();
    expect(listingIds).toEqual([TEST_LISTING_A, TEST_LISTING_B].sort());
  });

  it('blocks a concurrent applyToListing while another transaction holds the account row lock', async () => {
    const repository = new DrizzleApplicationRepository();
    const rawClient = new Client({ connectionString: process.env.DATABASE_URL });
    await rawClient.connect();

    try {
      await rawClient.query('BEGIN');
      await rawClient.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [testAccountId]);

      let holdingTxCommittedAt = 0;
      const holdingTx = (async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await rawClient.query('COMMIT');
        holdingTxCommittedAt = Date.now();
      })();

      let applyCompletedAt = 0;
      const applyTx = (async () => {
        await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });
        applyCompletedAt = Date.now();
      })();

      await Promise.all([holdingTx, applyTx]);

      // Proves the account row is genuinely exclusive-locked for the
      // duration of the transaction: applyToListing only completes once the
      // holding transaction commits and releases it. Note this does NOT
      // isolate the repository's own explicit `.for('update')` as the sole
      // cause — Postgres also takes an implicit FK-check lock on the
      // referenced `accounts` row when inserting into `applications`, which
      // independently blocks against the raw client's FOR UPDATE (verified
      // by temporarily removing `.for('update')` from the repository: this
      // test still passed). The explicit lock still matters once Story 2.4
      // adds a read-then-decide step (recompute count, evaluate thresholds)
      // inside the same transaction — the implicit FK lock alone would not
      // serialize a plain read.
      expect(applyCompletedAt).toBeGreaterThanOrEqual(holdingTxCommittedAt);
    } finally {
      await rawClient.end();
    }
  });
});
