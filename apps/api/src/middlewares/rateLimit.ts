import rateLimit from 'express-rate-limit';

/** Global limit — sane default to catch crawlers and bursts. */
export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});

/** Strict limit for auth endpoints — OTP request abuse is also caught downstream by DB-backed limiter. */
export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many auth requests' } },
});

/** Webhook endpoint limit — generous, since Razorpay may retry. */
export const webhookLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
