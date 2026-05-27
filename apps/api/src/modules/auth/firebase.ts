import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { env, hasFirebaseConfig } from '../../config/env.js';
import { ConfigError, UnauthorizedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

let app: App | null = null;
let firebaseAuth: Auth | null = null;

function initFirebase(): void {
  if (app) return;
  if (!hasFirebaseConfig) {
    throw new ConfigError(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env. See SETUP_THIRD_PARTY.md.',
    );
  }
  const existing = getApps()[0];
  if (existing) {
    app = existing;
  } else {
    app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID!,
        clientEmail: env.FIREBASE_CLIENT_EMAIL!,
        // Replace escaped newlines that come from .env files.
        privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  }
  firebaseAuth = getAuth(app);
  logger.info('Firebase Admin SDK initialized');
}

/**
 * Verify a Firebase ID token (obtained on the client after OTP flow).
 * Returns the verified phone number on success.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  initFirebase();
  if (!firebaseAuth) throw new ConfigError('Firebase Auth not initialized');
  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken, true);
    if (!decoded.phone_number) {
      throw new UnauthorizedError('Token has no phone_number claim');
    }
    return decoded.phone_number;
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ConfigError) throw err;
    logger.warn({ err }, 'Firebase ID token verification failed');
    throw new UnauthorizedError('Invalid Firebase ID token');
  }
}
