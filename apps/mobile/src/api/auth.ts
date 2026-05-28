// Auth API surface.
//
// Mirrors the backend at apps/api/src/modules/auth/. Request schemas come
// from the shared workspace package so mobile and backend can never drift.

import type { RequestOtpInput, VerifyOtpInput } from '@nearfold/shared';

import { api } from './client';

export interface AuthUser {
  id: string;
  phone: string;
  role: 'buyer' | 'seller' | 'both';
  name: string | null;
}

interface RequestOtpResponse {
  ok: true;
  remaining: number;
}

interface VerifyOtpResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  /**
   * Pre-check before invoking Firebase signInWithPhoneNumber. The backend
   * counts requests per phone per hour and rejects abuse early.
   */
  requestOtp: (input: RequestOtpInput) =>
    api.post<RequestOtpResponse>('/auth/request-otp', input, { unauth: true }),

  /**
   * Trade a Firebase ID token (proof the user owns the phone) for our JWT.
   */
  verifyOtp: (input: VerifyOtpInput) =>
    api.post<VerifyOtpResponse>('/auth/verify-otp', input, { unauth: true }),
};
