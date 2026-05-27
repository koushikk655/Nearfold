import 'dotenv/config';
import { z } from 'zod';

/**
 * Zod-validated environment loader. Fails fast on boot if any required var
 * is missing or malformed, surfacing a clear error before any request is served.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_TOKEN_TTL: z.string().default('7d'),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  GOOGLE_MAPS_API_KEY: z.string().optional(),

  ADMIN_KEY: z.string().min(8, 'ADMIN_KEY must be at least 8 characters').default('change-me'),

  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(50).default(5),

  OTP_REQUEST_LIMIT_PER_HOUR: z.coerce.number().int().min(1).max(100).default(5),

  CORS_ORIGINS: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';

/** True only when all Firebase Admin credentials are present. */
export const hasFirebaseConfig = Boolean(
  env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY,
);

/** True only when Razorpay is fully configured. */
export const hasRazorpayConfig = Boolean(
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET,
);

/** True only when Cloudinary is fully configured. */
export const hasCloudinaryConfig = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
