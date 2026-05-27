import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env, isProduction } from '../config/env.js';
import { logger } from '../utils/logger.js';
import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Many free-tier managed Postgres providers (Neon, Supabase) require SSL
  // even from local dev. Enable when the URL says sslmode=require.
  ssl: env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  max: isProduction ? 20 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export const db = drizzle(pool, { schema, logger: false });

export type Database = typeof db;
