// Auth API surface.
//
// Mirrors the backend at apps/api/src/modules/auth/. Request schemas come
// from the shared workspace package so mobile and backend can never drift.
//
// Week 2.5 added refresh / logout / logout-all per project doc
// 🔐 "Spec — Backend: /auth/refresh + refresh-token rotation". During the
// backend's PR-A transition window the verify-otp endpoint returns BOTH
// the deprecated `token` field AND the new pair shape; we accept either.

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

/**
 * Shape returned by /auth/verify-otp and /auth/refresh.
 *
 * Old shape (legacy): { token, user }
 * Transition shape: { token, accessToken, refreshToken, *ExpiresAt, user }
 * Target shape: { accessToken, refreshToken, *ExpiresAt, user }
 *
 * authStore.setSession() handles all three.
 */
export interface VerifyOtpResponse {
  accessToken?: string;
  /** Legacy alias for accessToken; backend keeps it during PR-A. */
  token?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export const authApi = {
  /**
   * Pre-check before invoking Firebase signInWithPhoneNumber. The backend
   * counts requests per phone per hour and rejects abuse early.
   */
  requestOtp: (input: RequestOtpInput) =>
    api.post<RequestOtpResponse>('/auth/request-otp', input, { unauth: true }),

  /**
   * Trade a Firebase ID token (proof the user owns the phone) for our
   * JWT pair.
   */
  verifyOtp: (input: VerifyOtpInput) =>
    api.post<VerifyOtpResponse>('/auth/verify-otp', input, { unauth: true }),

  /**
   * Exchange a refresh token for a new access + refresh pair. Called by
   * the api/client.ts 401 interceptor — DO NOT call directly from screens
   * unless you know what you're doing (you'll race the interceptor).
   *
   * `skipRefresh: true` so a failure here doesn't recurse into the
   * interceptor.
   */
  refresh: (refreshToken: string) =>
    api.post<RefreshResponse>(
      '/auth/refresh',
      { refreshToken },
      { unauth: true, skipRefresh: true },
    ),

  /**
   * Revoke a single refresh token (this device). Best-effort — always
   * returns success-ish from the backend per the spec, so callers can
   * ignore errors.
   */
  logout: (refreshToken: string) =>
    api.post<{ ok: true }>(
      '/auth/logout',
      { refreshToken },
      { unauth: true, skipRefresh: true },
    ),

  /**
   * Revoke every active refresh token for the authenticated user.
   * Requires a valid access token in the Authorization header.
   */
  logoutAll: () =>
    api.post<{ ok: true }>('/auth/logout-all', undefined, { skipRefresh: true }),
};
