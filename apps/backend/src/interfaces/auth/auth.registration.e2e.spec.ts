import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from '../../infrastructure/persistence/drizzle/account.schema.js';
import { closeDb, getDb } from '../../infrastructure/persistence/drizzle/db.js';
import { employerProfilesTable } from '../../infrastructure/persistence/drizzle/employer-profile.schema.js';
import { AuthModule } from './auth.module.js';

/**
 * `auth.validation.e2e.spec.ts` only exercises ValidationPipe rejections —
 * every case there is rejected before the controller/use case/DB is ever
 * reached, so it never proves `POST /auth/register/employer` actually
 * persists both rows together. This does: real HTTP via supertest, real
 * Postgres, asserting the `accounts` row (`role: 'Employer'`) and the
 * `employer_profiles` row (`verificationStatus: 'pending'`) both exist
 * after a single successful registration call.
 */
describe('Employer registration (e2e, real Postgres)', () => {
  let app: INestApplication;
  const TEST_EMAIL = '__test__employer-registration-e2e@example.com';

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    const [existing] = await db.select().from(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    if (existing) {
      await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, existing.id));
      await db.delete(accountsTable).where(eq(accountsTable.id, existing.id));
    }

    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    const db = getDb();
    const [account] = await db.select().from(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    if (account) {
      await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, account.id));
      await db.delete(accountsTable).where(eq(accountsTable.id, account.id));
    }
    await closeDb();
  });

  it('creates both the accounts row and a pending employer_profiles row on a single successful registration', async () => {
    const response = await supertest(app.getHttpServer())
      .post('/auth/register/employer')
      .send({ email: TEST_EMAIL, password: 'correcthorsebattery', companyName: 'Acme Corp' })
      .expect(201);

    expect(typeof response.body.accessToken).toBe('string');

    const db = getDb();
    const [account] = await db.select().from(accountsTable).where(eq(accountsTable.email, TEST_EMAIL));
    expect(account?.role).toBe('Employer');

    const [profile] = await db
      .select()
      .from(employerProfilesTable)
      .where(eq(employerProfilesTable.accountId, account!.id));
    expect(profile).toEqual({
      accountId: account!.id,
      companyName: 'Acme Corp',
      verificationStatus: 'pending',
    });
  });
});
