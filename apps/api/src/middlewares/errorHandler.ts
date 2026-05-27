import type { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/** Final Express error handler. Must have arity 4. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.warn({ err: { code: err.code, message: err.message }, path: req.path }, err.message);
    }
    const body: ErrorBody = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown error → 500
  logger.error({ err, path: req.path }, 'Unhandled error');

  const body: ErrorBody = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Internal server error' : (err as Error)?.message ?? 'Unknown error',
      ...(!isProduction && err instanceof Error ? { stack: err.stack } : {}),
    },
  };
  res.status(500).json(body);
}

/** 404 handler — registered after all routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  });
}
