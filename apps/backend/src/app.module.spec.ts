import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { closeDb } from './infrastructure/persistence/drizzle/db.js';

/**
 * No test anywhere else boots the full `AppModule` — `pnpm --filter
 * backend test` can pass green while `main.ts`'s
 * `NestFactory.create(AppModule, ...)` fails to start on a DI wiring
 * mistake (e.g. a module forgetting to bind a port its use case needs),
 * and nothing would catch it. This is that smoke test: compile the real
 * `AppModule` graph and boot a Nest application from it.
 *
 * Needs a live Postgres (docker compose up -d db) — the DI graph includes
 * DB-backed repositories, same fallback pattern as this repo's other
 * real-Postgres integration specs (e.g.
 * `interfaces/listings/my-listings.auth.e2e.spec.ts`).
 */
describe('AppModule (DI boot smoke test)', () => {
  process.env.DATABASE_URL ??= 'postgres://geoemploi:geoemploi@localhost:5432/geoemploi';

  afterAll(async () => {
    await closeDb();
  });

  it('resolves the full DI graph and boots without throwing', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app: INestApplication = moduleRef.createNestApplication();

    await app.init();

    expect(app).toBeDefined();

    await app.close();
  });
});
