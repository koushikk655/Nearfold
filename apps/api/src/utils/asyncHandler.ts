import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wrap async route handlers so that thrown errors propagate to Express's
 * error-handling middleware. Avoids try/catch boilerplate in every handler.
 */
export const asyncHandler =
  <Req extends Request = Request, Res extends Response = Response>(
    fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
