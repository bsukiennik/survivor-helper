import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from '../../infrastructure/persistence/drizzle/account.schema.js';
import { closeDb, getDb } from '../../infrastructure/persistence/drizzle/db.js';
import { employerProfilesTable } from '../../infrastructure/persistence/drizzle/employer-profile.schema.js';
import { EmployerModule } from './employer.module.js';

/**
 * Real HTTP layer via supertest (same pattern as
 * application/badges.auth.e2e.spec.ts) so the guard stack on
 * `GET /me/employer-profile` — `JwtAuthGuard` + `RolesGuard` +
 * `@Roles('Employer')` — is actually exercised end-to-end. Every case here
 * is rejected by a guard before the controller (and therefore
 * `GetMyEmployerProfileUseCase`/the DB-backed repository) is ever reached,
 * so no live Postgres is needed — closes the I/O matrix's 401/403 rows.
 */
describe('Employer profile auth gate (e2e, JwtAuthGuard + RolesGuard)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [EmployerModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects with 401 when no bearer token is present', async () => {
    await supertest(app.getHttpServer()).get('/me/employer-profile').expect(401);
  });

  it('rejects with 401 for an invalid/malformed token', async () => {
    await supertest(app.getHttpServer())
      .get('/me/employer-profile')
      .set('authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('rejects with 403 for a valid token whose role is not Employer (JobSeeker)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-jobseeker', role: 'JobSeeker' });

    await supertest(app.getHttpServer())
      .get('/me/employer-profile')
      .set('authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('rejects with 403 for a valid token whose role is not Employer (Administrator)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-admin', role: 'Administrator' });

    await supertest(app.getHttpServer())
      .get('/me/employer-profile')
      .set('authorization', `Bearer ${token}`)
      .expect(403);
  });
});

/**
 * The 401/403 cases above never reach the guard→@CurrentUser()→controller
 * hand-off. This proves the success path — including the I/O matrix's
 * "check status after seeded verification" row — by seeding
 * `verificationStatus: 'verified'` directly via Drizzle, simulating the
 * not-yet-built (Epic 5) admin-verify action, same pattern as
 * `job-seeker-profile.repository.spec.ts` /
 * `profile.auth.e2e.spec.ts`'s success-path describe block.
 *
 * Needs a live Postgres (docker compose up -d db) — the use case hits the
 * real DrizzleEmployerProfileRepository. `employer_profiles.accountId` has
 * an FK to `accounts.id`, so the token's `sub` must reference a real row —
 * seeded directly (this module has no AuthController to register through).
 */
describe('Employer profile auth gate (e2e, valid token — success path)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const ACCOUNT_ID = 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2';
  const TEST_EMAIL = '__test__employer-profile-e2e@example.com';

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    // employer_profiles.accountId has no onDelete cascade (Design Notes) —
    // the profile row must go before the account row.
    await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await db.insert(accountsTable).values({
      id: ACCOUNT_ID,
      email: TEST_EMAIL,
      passwordHash: 'not-used-by-this-test',
      role: 'Employer',
    });
    await db.insert(employerProfilesTable).values({ accountId: ACCOUNT_ID, companyName: 'Acme' });

    const moduleRef = await Test.createTestingModule({ imports: [EmployerModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
    const db = getDb();
    await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await closeDb();
  });

  it('reflects pending, then reflects verified once seeded directly in Postgres', async () => {
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .get('/me/employer-profile')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ companyName: 'Acme', verificationStatus: 'pending' });
      });

    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, ACCOUNT_ID));

    await supertest(app.getHttpServer())
      .get('/me/employer-profile')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ companyName: 'Acme', verificationStatus: 'verified' });
      });
  });
});
