import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { accountsTable } from '../../infrastructure/persistence/drizzle/account.schema.js';
import { closeDb, getDb } from '../../infrastructure/persistence/drizzle/db.js';
import { jobSeekerProfilesTable } from '../../infrastructure/persistence/drizzle/job-seeker-profile.schema.js';
import { ProfileModule } from './profile.module.js';

/**
 * Real HTTP layer via supertest (same pattern as
 * auth/auth.validation.e2e.spec.ts) so `JwtAuthGuard` is actually exercised
 * end-to-end rather than only against a mocked `ExecutionContext`.
 *
 * No live Postgres needed: every case here is rejected by the guard before
 * the controller — and therefore the DB-backed repository — is ever reached.
 */
describe('Profile auth gate (e2e, JwtAuthGuard)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ProfileModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects GET /me/profile with 401 when no bearer token is present', async () => {
    await supertest(app.getHttpServer()).get('/me/profile').expect(401);
  });

  it('rejects PUT /me/profile with 401 when no bearer token is present', async () => {
    await supertest(app.getHttpServer())
      .put('/me/profile')
      .send({ skills: 'x', experience: 'y', availability: 'z' })
      .expect(401);
  });

  it('rejects GET /me/profile with 401 for an invalid/malformed token', async () => {
    await supertest(app.getHttpServer())
      .get('/me/profile')
      .set('authorization', 'Bearer not-a-real-token')
      .expect(401);
  });
});

/**
 * The 401 cases above never reach the guard→@CurrentUser()→controller
 * hand-off — they're all rejected by JwtAuthGuard first. This proves the
 * success path: a *valid* token actually flows through to the controller
 * with the right account id, and the response is scoped to it.
 *
 * Needs a live Postgres (docker compose up -d db) — the profile use cases
 * hit the real DrizzleJobSeekerProfileRepository, same as
 * job-seeker-profile.repository.spec.ts. `job_seeker_profiles.accountId`
 * has an FK to `accounts.id`, so the token's `sub` must reference a real
 * row — seeded directly (this module has no AuthController to register
 * through), same pattern as account.repository.spec.ts.
 */
describe('Profile auth gate (e2e, valid token — success path)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const ACCOUNT_ID = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
  const TEST_EMAIL = '__test__profile-e2e@example.com';

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';
    const db = getDb();
    // job_seeker_profiles.accountId has no onDelete cascade (see
    // deferred-work.md) — the profile row must go before the account row.
    await db.delete(jobSeekerProfilesTable).where(eq(jobSeekerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await db.insert(accountsTable).values({
      id: ACCOUNT_ID,
      email: TEST_EMAIL,
      passwordHash: 'not-used-by-this-test',
      role: 'JobSeeker',
    });

    const moduleRef = await Test.createTestingModule({ imports: [ProfileModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
    const db = getDb();
    await db.delete(jobSeekerProfilesTable).where(eq(jobSeekerProfilesTable.accountId, ACCOUNT_ID));
    await db.delete(accountsTable).where(eq(accountsTable.id, ACCOUNT_ID));
    await closeDb();
  });

  it('scopes GET/PUT /me/profile to the account id carried by the token', async () => {
    const token = await jwtService.signAsync({ sub: ACCOUNT_ID, role: 'JobSeeker' });

    await supertest(app.getHttpServer())
      .get('/me/profile')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          skills: null,
          experience: null,
          availability: null,
          updatedAt: null,
        });
      });

    await supertest(app.getHttpServer())
      .put('/me/profile')
      .set('authorization', `Bearer ${token}`)
      .send({ skills: 'React', experience: '3 ans', availability: 'immédiate' })
      .expect(200);

    await supertest(app.getHttpServer())
      .get('/me/profile')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.skills).toBe('React');
        expect(res.body.experience).toBe('3 ans');
        expect(res.body.availability).toBe('immédiate');
      });
  });
});
