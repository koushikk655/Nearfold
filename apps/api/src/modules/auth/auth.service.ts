import { env } from '../../config/env.js';
import { RateLimitError } from '../../utils/errors.js';
import { signAccessToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';
import { authRepository } from './auth.repository.js';
import { verifyFirebaseIdToken } from './firebase.js';

export const authService = {
  /**
   * "Request OTP" — for Firebase OTP flow, the client actually requests the OTP
   * directly via Firebase SDK. This endpoint exists to enforce per-phone abuse
   * limits before the client makes the Firebase call.
   */
  async requestOtp(phone: string): Promise<{ ok: true; remaining: number }> {
    const count = await authRepository.countOtpRequestsWithinHour(phone);
    if (count >= env.OTP_REQUEST_LIMIT_PER_HOUR) {
      throw new RateLimitError(
        `OTP request limit reached for this phone. Try again in an hour.`,
      );
    }
    await authRepository.logOtpRequest(phone);
    logger.info({ phone }, 'OTP request acknowledged');
    return { ok: true, remaining: env.OTP_REQUEST_LIMIT_PER_HOUR - count - 1 };
  },

  /**
   * Verify Firebase ID token, upsert the user, and return a JWT access token.
   */
  async verifyOtp(
    phone: string,
    firebaseIdToken: string,
  ): Promise<{ token: string; user: { id: string; phone: string; role: string; name: string | null } }> {
    const verifiedPhone = await verifyFirebaseIdToken(firebaseIdToken);
    if (verifiedPhone !== phone) {
      // Defensive — phone in payload must match the verified token
      logger.warn({ verifiedPhone, payloadPhone: phone }, 'Phone mismatch');
      throw new RateLimitError('Phone number does not match verified token');
    }

    let user = await authRepository.findUserByPhone(phone);
    if (!user) {
      user = await authRepository.createUser({ phone, isVerified: true });
    } else if (!user.isVerified) {
      await authRepository.markVerified(user.id);
      user = { ...user, isVerified: true };
    }

    const token = signAccessToken({ sub: user.id, phone: user.phone, role: user.role });
    return { token, user: { id: user.id, phone: user.phone, role: user.role, name: user.name } };
  },
};
