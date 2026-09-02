import 'reflect-metadata';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { AuthModule } from './auth.module.js';

/**
 * The unit specs for AuthController call its methods directly, which never
 * exercises Nest's ValidationPipe — the thing that actually enforces
 * RegisterDto/LoginDto's decorators (@IsEmail, @MinLength, ...) on a real
 * request. This boots the real pipe (same config as main.ts) against the
 * real HTTP layer via supertest, so a dropped/weakened decorator would
 * actually fail a test.
 *
 * No live Postgres needed: every case here is rejected by the pipe before
 * the controller — and therefore the DB-backed repository — is ever reached.
 */
describe('Auth validation (e2e, ValidationPipe)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects registration with a malformed email', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'correcthorsebattery' })
      .expect(400);
  });

  it('rejects registration with a too-short password', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'a@b.com', password: 'short' })
      .expect(400);
  });

  it('rejects registration with an unknown extra field (forbidNonWhitelisted)', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'a@b.com', password: 'correcthorsebattery', role: 'Administrator' })
      .expect(400);
  });

  it('rejects employer registration with a malformed email', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register/employer')
      .send({ email: 'not-an-email', password: 'correcthorsebattery', companyName: 'Acme' })
      .expect(400);
  });

  it('rejects employer registration with a too-short password', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register/employer')
      .send({ email: 'a@b.com', password: 'short', companyName: 'Acme' })
      .expect(400);
  });

  it('rejects employer registration with a missing companyName', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register/employer')
      .send({ email: 'a@b.com', password: 'correcthorsebattery' })
      .expect(400);
  });

  it('rejects employer registration with a blank companyName', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register/employer')
      .send({ email: 'a@b.com', password: 'correcthorsebattery', companyName: '   ' })
      .expect(400);
  });

  it('rejects login with a malformed email', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'x' })
      .expect(400);
  });

  it('rejects login with an empty password', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'a@b.com', password: '' })
      .expect(400);
  });
});
