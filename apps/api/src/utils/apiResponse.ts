import type { Response } from 'express';

export interface SuccessOptions {
  meta?: Record<string, unknown>;
  statusCode?: number;
}

export function sendSuccess<T>(res: Response, data: T, opts: SuccessOptions = {}): void {
  const { statusCode = 200, meta } = opts;
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T, meta?: Record<string, unknown>): void {
  sendSuccess(res, data, { statusCode: 201, meta });
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
