import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from './account.schema.js';
import { closeDb, getDb } from './db.js';
import { jobSeekerProfilesTable } from './job-seeker-profile.schema.js';
import { DrizzleJobSeekerProfileRepository } from './job-seeker-profile.repository.js';

/**
 * Integration test against a real Postgres — see account.repository.spec.ts
 * for why: the unit-level use-case specs stub the repository port entirely,
 * so the actual upsert-on-conflict and row-mapping had zero coverage.
 *
 * Requires a reachable Postgres with the `job_seeker_profiles` table
 * migrated — `docker compose up -d` (which runs the migration on boot)
 * before `pnpm --filter backend test` satisfies this; DATABASE_URL falls
 * back to docker-compose's published port when not already set.
 */

const TEST_EMAIL = '__test__job-seeker-profile-repository@example.com';
let testAccountId = '';

describe('DrizzleJobSeekerProfileRepository (integration, real Postgres)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    const [account] = await db
      .insert(accountsTable)
      .values({ email: TEST_EMAIL, passwordHash: 'irrelevant', role: 'JobSeeker' })
      .returning();
    testAccountId = account.id;
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(jobSeekerProfilesTable).where(eq(jobSeekerProfilesTable.accountId, testAccountId));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    await closeDb();
  });

  it('returns null when no profile row exists yet for the account', async () => {
    const repository = new DrizzleJobSeekerProfileRepository();

    const found = await repository.findByAccountId(testAccountId);

    expect(found).toBeNull();
  });

  it('creates a profile row on first upsert and finds it back', async () => {
    const repository = new DrizzleJobSeekerProfileRepository();

    const created = await repository.upsert({
      accountId: testAccountId,
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });
    expect(created.accountId).toBe(testAccountId);
    expect(created.skills).toBe('Boulangerie');

    const found = await repository.findByAccountId(testAccountId);
    expect(found?.skills).toBe('Boulangerie');
    expect(found?.experience).toBe('3 ans');
    expect(found?.availability).toBe('Immédiate');
  });

  it('overwrites the existing row on a second upsert instead of erroring or duplicating', async () => {
    const repository = new DrizzleJobSeekerProfileRepository();
    await repository.upsert({
      accountId: testAccountId,
      skills: 'Boulangerie',
      experience: '3 ans',
      availability: 'Immédiate',
    });

    const updated = await repository.upsert({
      accountId: testAccountId,
      skills: 'Pâtisserie',
      experience: '5 ans',
      availability: 'Dans 1 mois',
    });

    expect(updated.skills).toBe('Pâtisserie');

    const rows = await getDb()
      .select()
      .from(jobSeekerProfilesTable)
      .where(eq(jobSeekerProfilesTable.accountId, testAccountId));
    expect(rows).toHaveLength(1);
    expect(rows[0].skills).toBe('Pâtisserie');
    expect(rows[0].experience).toBe('5 ans');
    expect(rows[0].availability).toBe('Dans 1 mois');
  });
});
