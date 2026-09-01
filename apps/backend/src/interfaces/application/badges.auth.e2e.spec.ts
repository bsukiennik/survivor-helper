import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { ApplicationModule } from './application.module.js';

/**
 * Real HTTP layer via supertest (same pattern as
 * application.auth.e2e.spec.ts) so the guard stack on `GET /me/badges` —
 * `JwtAuthGuard` + `RolesGuard` + `@Roles('JobSeeker')` — is actually
 * exercised end-to-end. Every case here is rejected by a guard before the
 * controller (and therefore `GetMyBadgesUseCase`/the DB-backed
 * repositories) is ever reached, so no live Postgres is needed — closes the
 * I/O matrix's 401/403 rows, which the unit-level badges.controller.spec.ts
 * (mocked use case) and the generic guard specs (mocked ExecutionContext)
 * don't cover for this route.
 */
describe('Badges auth gate (e2e, JwtAuthGuard + RolesGuard)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ApplicationModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects with 401 when no bearer token is present', async () => {
    await supertest(app.getHttpServer()).get('/me/badges').expect(401);
  });

  it('rejects with 401 for an invalid/malformed token', async () => {
    await supertest(app.getHttpServer())
      .get('/me/badges')
      .set('authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('rejects with 403 for a valid token whose role is not JobSeeker (Employer)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-employer', role: 'Employer' });

    await supertest(app.getHttpServer()).get('/me/badges').set('authorization', `Bearer ${token}`).expect(403);
  });

  it('rejects with 403 for a valid token whose role is not JobSeeker (Administrator)', async () => {
    const token = await jwtService.signAsync({ sub: 'account-admin', role: 'Administrator' });

    await supertest(app.getHttpServer()).get('/me/badges').set('authorization', `Bearer ${token}`).expect(403);
  });
});
