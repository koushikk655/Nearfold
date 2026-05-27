import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';

export interface JwtPayload {
  sub: string; // user id
  phone: string;
  role: 'buyer' | 'seller' | 'both';
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
    issuer: 'nearfold-api',
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'nearfold-api' });
    if (typeof decoded === 'string') {
      throw new UnauthorizedError('Invalid token payload');
    }
    return decoded as unknown as JwtPayload;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired token');
  }
}
