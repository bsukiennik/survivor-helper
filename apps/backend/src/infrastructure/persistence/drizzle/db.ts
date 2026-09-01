import { Logger } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as accountSchema from './account.schema.js';
import * as jobSeekerProfileSchema from './job-seeker-profile.schema.js';
import * as listingSchema from './listing.schema.js';

const schema = { ...listingSchema, ...accountSchema, ...jobSeekerProfileSchema };

const logger = new Logger('DrizzlePool');

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;

/**
 * Lazily-created singleton pool/db handle. Kept out of the domain/application
 * layers (AD-1) — only infrastructure code ever imports this module.
 */
export function getDb(): NodePgDatabase<typeof schema> {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set — see .env.example');
    }
    pool = new Pool({ connectionString });
    // node-postgres requires an 'error' listener on the pool: an error on
    // an idle client (e.g. the DB restarting) is otherwise an uncaught
    // event that crashes the whole process.
    pool.on('error', (err) => {
      logger.error(`Unexpected error on idle Postgres client: ${err.message}`, err.stack);
    });
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  db = undefined;
}
