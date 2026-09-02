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
const OTHER_TEST_EMAIL = '__test__application-repository-other@example.com';
const TEST_LISTING_A = '99999999-9999-4999-8999-000000000101';
const TEST_LISTING_B = '99999999-9999-4999-8999-000000000102';
// 9 seed listings for the 9th→10th-threshold race test below — distinct
// from A/B so that test's two concurrent catches (on A and B) are each
// genuinely the Job Seeker's 10th and 11th distinct catch.
const TEST_LISTING_SEED = Array.from(
  { length: 9 },
  (_, i) => `99999999-9999-4999-8999-0000000001${String(i + 3).padStart(2, '0')}`,
);
const TEST_LISTING_IDS = [TEST_LISTING_A, TEST_LISTING_B, ...TEST_LISTING_SEED];

let testAccountId = '';

describe('DrizzleApplicationRepository (integration, real Postgres)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();

    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    await db.delete(accountsTable).where(eq(accountsTable.email, OTHER_TEST_EMAIL));
    const [account] = await db
      .insert(accountsTable)
      .values({ email: TEST_EMAIL, passwordHash: 'irrelevant', role: 'JobSeeker' })
      .returning();
    testAccountId = account.id;

    await db
      .insert(listingsTable)
      .values(
        [TEST_LISTING_A, TEST_LISTING_B, ...TEST_LISTING_SEED].map((id, index) => ({
          id,
          title: `__test__ listing ${index}`,
          employerName: 'Test Co',
          location: 'Testville',
          description: 'seeded by application.repository.spec.ts',
          latitude: 0,
          longitude: 0,
          status: 'published' as const,
        })),
      )
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

  it('creates an Application row and returns catchCount 1 on first catch', async () => {
    const repository = new DrizzleApplicationRepository();

    const created = await repository.applyToListing({
      jobSeekerId: testAccountId,
      listingId: TEST_LISTING_A,
    });

    expect(created).not.toBeNull();
    expect(created?.application.jobSeekerId).toBe(testAccountId);
    expect(created?.application.listingId).toBe(TEST_LISTING_A);
    expect(created?.application.status).toBe('submitted');
    expect(created?.catchCount).toBe(1);

    const rows = await getDb()
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.jobSeekerId, testAccountId));
    expect(rows).toHaveLength(1);
  });

  it('countByJobSeeker matches the persisted Application count, standalone (no transaction)', async () => {
    const repository = new DrizzleApplicationRepository();

    expect(await repository.countByJobSeeker(testAccountId)).toBe(0);

    await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });
    expect(await repository.countByJobSeeker(testAccountId)).toBe(1);

    await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_B });
    expect(await repository.countByJobSeeker(testAccountId)).toBe(2);
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

  it('exactly-once 9th→10th race: two concurrent catches on different Listings yield exactly one catchCount 10', async () => {
    const repository = new DrizzleApplicationRepository();

    // 9 prior distinct catches, sequential so the count is deterministic
    // before the race starts.
    for (const listingId of TEST_LISTING_SEED) {
      const seeded = await repository.applyToListing({ jobSeekerId: testAccountId, listingId });
      expect(seeded).not.toBeNull();
    }
    expect(await repository.countByJobSeeker(testAccountId)).toBe(9);

    // The 9th→10th threshold race (Boundaries & Constraints, Design
    // Notes): two different-Listing catches by the same Job Seeker fired
    // concurrently. Story 2.3's account-row `FOR UPDATE` lock serializes
    // the two transactions, so this must yield exactly one catchCount 10
    // and one catchCount 11 — never two 10s, never zero.
    const [resultA, resultB] = await Promise.all([
      repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A }),
      repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_B }),
    ]);

    expect(resultA).not.toBeNull();
    expect(resultB).not.toBeNull();
    const catchCounts = [resultA?.catchCount, resultB?.catchCount].sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(catchCounts).toEqual([10, 11]);
    expect(await repository.countByJobSeeker(testAccountId)).toBe(11);
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

  describe('findByJobSeekerWithListing (Story 2.5, first Drizzle join)', () => {
    it('returns [] (not an error) for an account with no Applications', async () => {
      const repository = new DrizzleApplicationRepository();

      const rows = await repository.findByJobSeekerWithListing(testAccountId);

      expect(rows).toEqual([]);
    });

    it('returns each Application joined with its Listing title/employer, newest first', async () => {
      const repository = new DrizzleApplicationRepository();
      await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });
      await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_B });

      const rows = await repository.findByJobSeekerWithListing(testAccountId);

      expect(rows).toHaveLength(2);
      // TEST_LISTING_B was caught second, so it's newest first.
      expect(rows[0]?.listingId).toBe(TEST_LISTING_B);
      expect(rows[0]?.listingTitle).toBe('__test__ listing 1');
      expect(rows[0]?.employerName).toBe('Test Co');
      expect(rows[0]?.status).toBe('submitted');
      expect(rows[1]?.listingId).toBe(TEST_LISTING_A);
    });

    it("reflects a seeded row's non-default status verbatim", async () => {
      const repository = new DrizzleApplicationRepository();
      await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });
      await getDb()
        .update(applicationsTable)
        .set({ status: 'shortlisted' })
        .where(eq(applicationsTable.jobSeekerId, testAccountId));

      const rows = await repository.findByJobSeekerWithListing(testAccountId);

      expect(rows[0]?.status).toBe('shortlisted');
    });

    it("never returns another Job Seeker's Applications", async () => {
      const db = getDb();
      const [otherAccount] = await db
        .insert(accountsTable)
        .values({ email: OTHER_TEST_EMAIL, passwordHash: 'irrelevant', role: 'JobSeeker' })
        .returning();

      try {
        const repository = new DrizzleApplicationRepository();
        await repository.applyToListing({ jobSeekerId: testAccountId, listingId: TEST_LISTING_A });
        await repository.applyToListing({ jobSeekerId: otherAccount.id, listingId: TEST_LISTING_B });

        const rows = await repository.findByJobSeekerWithListing(testAccountId);

        expect(rows).toHaveLength(1);
        expect(rows[0]?.listingId).toBe(TEST_LISTING_A);
      } finally {
        await db.delete(applicationsTable).where(eq(applicationsTable.jobSeekerId, otherAccount.id));
        await db.delete(accountsTable).where(eq(accountsTable.id, otherAccount.id));
      }
    });
  });
});
