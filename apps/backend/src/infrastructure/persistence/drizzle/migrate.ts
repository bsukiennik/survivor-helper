import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb, closeDb } from './db.js';

async function main(): Promise<void> {
  await migrate(getDb(), {
    migrationsFolder: './src/infrastructure/persistence/drizzle/migrations',
  });
  // eslint-disable-next-line no-console
  console.log('Migrations applied.');
  await closeDb();
}

main().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  // Without this, a failed migration leaves the pg pool open and the
  // process hangs instead of exiting.
  await closeDb();
  process.exitCode = 1;
});
