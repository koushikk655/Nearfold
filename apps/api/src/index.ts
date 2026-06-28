import { env } from './config/env.js';
import { pool } from './db/client.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const app = createServer();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'NearKin API listening');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down…');
    server.close(async (err) => {
      if (err) logger.error({ err }, 'HTTP server close error');
      try {
        await pool.end();
        logger.info('Database pool closed');
      } catch (poolErr) {
        logger.error({ err: poolErr }, 'Failed to close pool');
      }
      process.exit(err ? 1 : 0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.warn('Forcing process exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
