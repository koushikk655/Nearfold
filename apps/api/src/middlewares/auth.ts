import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/jwt.js';

/** Requires a valid JWT. Sets req.user on success. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) return next(new UnauthorizedError('Empty bearer token'));

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires the authenticated user to have one of the allowed roles. */
export function requireRole(...allowed: Array<'buyer' | 'seller' | 'both'>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    const userRole = req.user.role;
    // 'both' satisfies any seller/buyer requirement
    const ok =
      allowed.includes(userRole) ||
      (userRole === 'both' && (allowed.includes('buyer') || allowed.includes('seller')));
    if (!ok) return next(new ForbiddenError(`Requires role: ${allowed.join(', ')}`));
    next();
  };
}

/** Admin-only endpoint guard. Uses a shared secret in the `X-Admin-Key` header. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const key = req.header('x-admin-key');
  if (!key || key !== env.ADMIN_KEY) {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}
