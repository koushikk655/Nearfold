/**
 * Standalone migration runner. Invoked via `pnpm db:migrate`.
 * Applies SQL files in src/db/migrations/ in alphabetical order.
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';
import { logger } from '../utils/logger.js';

async function main(): Promise<void> {
  logger.info('Running database migrations…');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  logger.info('Migrations complete.');
  await pool.end();
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
