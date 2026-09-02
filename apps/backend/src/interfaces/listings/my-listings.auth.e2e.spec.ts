import 'reflect-metadata';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from '../../infrastructure/persistence/drizzle/account.schema.js';
import { closeDb, getDb } from '../../infrastructure/persistence/drizzle/db.js';
import { employerProfilesTable } from '../../infrastructure/persistence/drizzle/employer-profile.schema.js';
import { listingsTable } from '../../infrastructure/persistence/drizzle/listing.schema.js';
import { EmployerListingsModule } from './employer-listings.module.js';

const VALID_BODY = {
  title: 'Boulanger / Boulangère',
  location: 'Paris',
  description: 'Poste à temps plein.',
  latitude: 48.8566,
  longitude: 2.3522,
  distributionRadiusKm: 5,
};

/**
 * Real HTTP layer via supertest (same pattern as
 * `employer/employer-profile.auth.e2e.spec.ts`) so the guard stack on
 * `POST /me/listings` — `JwtAuthGuard` + `RolesGuard` + `@Roles('Employer')`
 * — is actually exercised end-to-end. Every case here is rejected by a
 * guard before the controller (and therefore `PublishListingUseCase`/the
 * DB-backed repositories) is ever reached, so no live Postgres is needed —
 * closes the I/O matrix's 401/403 rows.
 */
describe('My listings auth gate (e2e, JwtAuthGuard + RolesGuard)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [EmployerListingsModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects with 401 when no bearer token is present', async () => {
    await supertest(app.getHttpServer()).post('/me/listings').send(VALID_BODY).expect(401);
  });

  it('rejects with 401 for an invalid/malformed token', async () => {
    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', 'Bearer not-a-real-token')
      .send(VALID_BODY)
      .expect(401);
  });

  it('rejects with 403 for a valid token whose role is not Employer (JobSeeker)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-jobseeker', role: 'JobSeeker' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send(VALID_BODY)
      .expect(403);
  });

  it('rejects with 403 for a valid token whose role is not Employer (Administrator)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-admin', role: 'Administrator' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send(VALID_BODY)
      .expect(403);
  });
});

/**
 * The 401/403 cases above never reach the guard→@CurrentUser()→controller
 * hand-off. This proves the rest of the I/O matrix — pending-Employer
 * rejection, radius-cap rejection, and the verified-Employer success path
 * — with a live Postgres, same pattern as
 * `employer/employer-profile.auth.e2e.spec.ts`'s success-path describe.
 *
 * Needs a live Postgres (docker compose up -d db) — the use case hits the
 * real repositories. `employer_profiles.accountId`/`listings.employerId`
 * both FK to `accounts.id`, so the token's `sub` must reference a real row
 * — seeded directly (this module has no AuthController to register
 * through).
 */
describe('My listings auth gate (e2e, valid token — publish flow)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const ACCOUNT_ID = 'c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3';
  const TEST_EMAIL = '__test__my-listings-e2e@example.com';

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    await db.delete(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await db.insert(accountsTable).values({
      id: ACCOUNT_ID,
      email: TEST_EMAIL,
      passwordHash: 'not-used-by-this-test',
      role: 'Employer',
    });
    await db
      .insert(employerProfilesTable)
      .values({ accountId: ACCOUNT_ID, companyName: 'Acme', verificationStatus: 'pending' });

    const moduleRef = await Test.createTestingModule({ imports: [EmployerListingsModule] }).compile();
    app = moduleRef.createNestApplication();
    // Real app behavior (main.ts) — the 400-on-invalid-body row of the I/O
    // matrix only exists because the global ValidationPipe runs; a bare
    // test app has none by default.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
    const db = getDb();
    await db.delete(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    await db.delete(employerProfilesTable).where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await closeDb();
  });

  it('rejects a pending Employer with 403 and a clear message, writing nothing', async () => {
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send(VALID_BODY)
      .expect(403)
      .expect((res) => {
        expect(typeof res.body.message).toBe('string');
        expect(res.body.message.length).toBeGreaterThan(0);
      });

    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    expect(rows).toHaveLength(0);
  });

  it('rejects a radius above the 10km cap with 400 before any DB write, even once verified', async () => {
    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send({ ...VALID_BODY, distributionRadiusKm: 15 })
      .expect(400);

    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    expect(rows).toHaveLength(0);
  });

  it('rejects a radius below the 0.1km floor with 400 before any DB write, even once verified', async () => {
    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send({ ...VALID_BODY, distributionRadiusKm: 0 })
      .expect(400);

    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    expect(rows).toHaveLength(0);
  });

  it('rejects an out-of-range latitude with 400 before any DB write, even once verified', async () => {
    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send({ ...VALID_BODY, latitude: 200 })
      .expect(400);

    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    expect(rows).toHaveLength(0);
  });

  it('publishes once verified, snapshotting employerName and capping at status published', async () => {
    await getDb()
      .update(employerProfilesTable)
      .set({ verificationStatus: 'verified' })
      .where(eq(employerProfilesTable.accountId, ACCOUNT_ID));
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'Employer' });

    await supertest(app.getHttpServer())
      .post('/me/listings')
      .set('authorization', `Bearer ${token}`)
      .send(VALID_BODY)
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('published');
        expect(res.body.employerName).toBe('Acme');
        expect(res.body.employerId).toBe(ACCOUNT_ID);
      });

    const rows = await getDb().select().from(listingsTable).where(eq(listingsTable.employerId, ACCOUNT_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('published');
  });
});
