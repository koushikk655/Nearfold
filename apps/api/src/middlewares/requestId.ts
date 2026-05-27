import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/** Adds an `X-Request-Id` header (honoring upstream if provided) for traceability. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.header('x-request-id') ?? randomUUID()).toString();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
