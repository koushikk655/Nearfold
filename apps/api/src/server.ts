import compression from 'compression';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env, isProduction } from './config/env.js';
import { requireAuth } from './middlewares/auth.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { globalLimiter } from './middlewares/rateLimit.js';
import { requestId } from './middlewares/requestId.js';
import v1Routes from './routes.js';
import { logger } from './utils/logger.js';

export function createServer(): Express {
  const app = express();

  // Trust proxy headers — needed when running behind Render/Railway/Fly load balancers.
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  // Request logging + tracing
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  // CORS — driven by env (`*` permitted in dev only; in prod, set explicit origins)
  const origins =
    env.CORS_ORIGINS === '*'
      ? '*'
      : env.CORS_ORIGINS.split(',')
          .map((o) => o.trim())
          .filter(Boolean);
  app.use(
    cors({
      origin: origins as cors.CorsOptions['origin'],
      credentials: true,
    }),
  );

  /**
   * JSON parser with `verify` callback that stashes the raw bytes on `req.rawBody`.
   * The Razorpay webhook handler uses these raw bytes to HMAC-verify the request
   * before trusting the parsed payload.
   */
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(compression());

  // Rate limiting (global)
  app.use(globalLimiter);

  // Health probe
  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { ok: true, env: env.NODE_ENV } });
  });

  // Authenticated ping for token sanity checks
  app.get('/api/v1/whoami', requireAuth, (req, res) => {
    res.status(200).json({ success: true, data: req.user });
  });

  // All other v1 routes
  app.use('/api/v1', v1Routes);

  // 404 + error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
