import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { EmailAlreadyRegisteredError } from '../../../domain/account/email-already-registered.error.js';
import { accountsTable } from './account.schema.js';
import { DrizzleAccountRepository } from './account.repository.js';
import { closeDb, getDb } from './db.js';

/**
 * Integration test against a real Postgres — see listing.repository.spec.ts
 * for why: the unit-level use-case specs stub the repository port entirely,
 * so the actual unique-email constraint and row-mapping had zero coverage.
 *
 * Requires a reachable Postgres with the `accounts` table migrated —
 * `docker compose up -d` (which runs the migration on boot) before
 * `pnpm --filter backend test` satisfies this; DATABASE_URL falls back to
 * docker-compose's published port when not already set.
 */

const TEST_EMAIL = '__test__account-repository@example.com';

describe('DrizzleAccountRepository (integration, real Postgres)', () => {
  beforeEach(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
  });

  afterAll(async () => {
    const db = getDb();
    await db.delete(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    await closeDb();
  });

  it('creates an account and finds it back by email', async () => {
    const repository = new DrizzleAccountRepository();

    const created = await repository.create({
      email: TEST_EMAIL,
      passwordHash: 'hashed-password',
      role: 'JobSeeker',
    });
    expect(created.email).toBe(TEST_EMAIL);
    expect(created.role).toBe('JobSeeker');
    expect(created.id).toBeTruthy();

    const found = await repository.findByEmail(TEST_EMAIL);
    expect(found?.id).toBe(created.id);
    expect(found?.passwordHash).toBe('hashed-password');
  });

  it('returns null when the email is not registered', async () => {
    const repository = new DrizzleAccountRepository();

    const found = await repository.findByEmail('__test__nobody@example.com');

    expect(found).toBeNull();
  });

  it('rejects a second insert with the same email via the unique constraint', async () => {
    const repository = new DrizzleAccountRepository();
    await repository.create({
      email: TEST_EMAIL,
      passwordHash: 'hashed-password',
      role: 'JobSeeker',
    });

    await expect(
      repository.create({ email: TEST_EMAIL, passwordHash: 'other-hash', role: 'JobSeeker' }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});
