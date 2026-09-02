import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from './account.schema.js';
import { closeDb, getDb } from './db.js';
import { DrizzleEmployerProfileRepository } from './employer-profile.repository.js';
import { employerProfilesTable } from './employer-profile.schema.js';

/**
 * Integration test against a real Postgres — see
 * job-seeker-profile.repository.spec.ts for why: the unit-level use-case
 * specs stub the repository port entirely, so the actual insert/row-mapping
 * (and the `verificationStatus` default) had zero coverage.
 *
 * Requires a reachable Postgres with the `employer_profiles` table
 * migrated — `docker compose up -d` (which runs the migration on boot)
 * before `pnpm --filter backend test` satisfies this; DATABASE_URL falls
 * back to docker-compose's published port when not already set.
 */

const TEST_EMAIL = '__test__employer-profile-repository@example.com';
let testAccountId = '';

describe('DrizzleEmployerProfileRepository (integration, real Postgres)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    const [account] = await db
      .insert(accountsTable)
      .values({ email: TEST_EMAIL, passwordHash: 'irrelevant', role: 'Employer' })
      .returning();
    testAccountId = account.id;
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, testAccountId));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    await closeDb();
  });

  it('returns null when no profile row exists yet for the account', async () => {
    const repository = new DrizzleEmployerProfileRepository();

    const found = await repository.findByAccountId(testAccountId);

    expect(found).toBeNull();
  });

  it('creates a profile row defaulting to pending verification and finds it back', async () => {
    const repository = new DrizzleEmployerProfileRepository();

    const created = await repository.create({ accountId: testAccountId, companyName: 'Acme' });
    expect(created.accountId).toBe(testAccountId);
    expect(created.companyName).toBe('Acme');
    expect(created.verificationStatus).toBe('pending');

    const found = await repository.findByAccountId(testAccountId);
    expect(found?.companyName).toBe('Acme');
    expect(found?.verificationStatus).toBe('pending');
  });

  // Simulates the not-yet-built (Epic 5) admin-verify action — seeded
  // directly via Drizzle, same pattern the spec's Code Map calls out.
  it('reflects a directly-seeded verificationStatus: verified update', async () => {
    const repository = new DrizzleEmployerProfileRepository();
    await repository.create({ accountId: testAccountId, companyName: 'Acme' });

    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, testAccountId));

    const found = await repository.findByAccountId(testAccountId);
    expect(found?.verificationStatus).toBe('verified');
  });

  it('deletes the profile row', async () => {
    const repository = new DrizzleEmployerProfileRepository();
    await repository.create({ accountId: testAccountId, companyName: 'Acme' });

    await repository.delete(testAccountId);

    const found = await repository.findByAccountId(testAccountId);
    expect(found).toBeNull();
  });
});
