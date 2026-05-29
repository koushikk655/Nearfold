// Typed fetch wrapper for the Nearfold backend.
//
// Conventions enforced here:
// - All routes live under /api/v1. The base URL comes from
//   Constants.expoConfig.extra.apiBaseUrl.
// - Auth-bearing requests inject `Authorization: Bearer <token>` from
//   authStore.
// - Backend envelope is { success: true, data } on success and
//   { success: false, error: { code, message, details? } } on failure.
//   We unwrap success → return `data`; failure → throw `ApiError`.
//
// 401 INTERCEPTOR — added in Week 2.5
// -----------------------------------
// When a non-internal request comes back 401 AND the auth store has a
// refresh token, we attempt ONE refresh, then retry the original request
// exactly once.
//
// Concurrent 401s coalesce on a shared promise so we don't fire N
// /auth/refresh calls in parallel (which would all rotate the same token
// against each other and trigger the backend's reuse-detection).
//
// Requests that opt out via `skipRefresh: true` (the refresh + logout
// endpoints themselves) bypass the interceptor entirely.

import Constants from 'expo-constants';

import { useAuthStore } from '../store/authStore';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(opts: { status: number; code: string; message: string; details?: unknown }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

interface EnvelopeSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
interface EnvelopeError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
type Envelope<T> = EnvelopeSuccess<T> | EnvelopeError;

function getBaseUrl(): string {
  const url = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  if (!url) {
    throw new Error(
      'apiBaseUrl missing from app.json expo.extra. ' +
        'Set it to your backend (e.g. http://localhost:3000/api/v1).',
    );
  }
  return url.replace(/\/+$/, '');
}

export interface RequestOptions {
  /** Skip Bearer token injection (for unauthenticated endpoints like /auth/*). */
  unauth?: boolean;
  /** Bypass the 401 → refresh → retry interceptor. Used by /auth/refresh
   *  itself + /auth/logout so a refresh failure doesn't recurse. */
  skipRefresh?: boolean;
  /** Abort the request after this many ms. Default 12s. */
  timeoutMs?: number;
  /** Query string params. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

// ────────────────────────────────────────────────────────────────────
// Refresh coalescing
// ────────────────────────────────────────────────────────────────────
// In-flight refresh, if any. Concurrent 401s await this rather than
// firing parallel /auth/refresh calls (which would race + trigger the
// backend's reuse detection on the loser).
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Attempt a refresh using the stored refresh token. Returns true on
 * success (authStore is updated), false on failure (authStore is cleared
 * and the caller should NOT retry).
 *
 * Multiple concurrent callers share the same promise.
 */
async function refreshTokenOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    // No refresh capability (either backend hasn't shipped refresh yet,
    // or the user truly has no session). Clear and force re-auth.
    useAuthStore.getState().clear();
    return false;
  }

  refreshInFlight = (async (): Promise<boolean> => {
    try {
      // Import lazily to avoid an authStore ↔ api/auth ↔ api/client cycle
      // when this file is initialized.
      const { authApi } = await import('./auth');
      const fresh = await authApi.refresh(refreshToken);
      useAuthStore.getState().setSession(fresh);
      return true;
    } catch (err) {
      // Any refresh failure → wipe local state. Distinguishing
      // REFRESH_REUSED / REFRESH_EXPIRED / REFRESH_INVALID is a Sentry
      // concern; for the UI they all mean "sign in again".
      // eslint-disable-next-line no-console
      console.warn('[auth] refresh failed', err);
      useAuthStore.getState().clear();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ────────────────────────────────────────────────────────────────────
// Core request
// ────────────────────────────────────────────────────────────────────
async function executeRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body: unknown | undefined,
  opts: RequestOptions,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = new URL(baseUrl + (path.startsWith('/') ? path : '/' + path));
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.append(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (!opts.unauth) {
    const token = useAuthStore.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: 'Request timed out. Check your connection and try again.',
      });
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: 'Could not reach the server. Check your connection.',
      details: err,
    });
  }
  clearTimeout(timeout);

  // 204 no-content
  if (res.status === 204) return undefined as T;

  let payload: Envelope<T>;
  try {
    payload = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError({
      status: res.status,
      code: 'INVALID_RESPONSE',
      message: `Server returned ${res.status} with an unparseable body.`,
    });
  }

  if (!payload || typeof payload !== 'object' || !('success' in payload)) {
    throw new ApiError({
      status: res.status,
      code: 'INVALID_RESPONSE',
      message: `Server returned ${res.status} with an unexpected envelope.`,
    });
  }

  if (payload.success) return payload.data;

  throw new ApiError({
    status: res.status,
    code: payload.error.code ?? 'UNKNOWN_ERROR',
    message: payload.error.message ?? `Request failed with ${res.status}.`,
    details: payload.error.details,
  });
}

/**
 * Public request entry-point. Wraps executeRequest with the 401 → refresh
 * → retry-once interceptor.
 */
async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body: unknown | undefined,
  opts: RequestOptions = {},
): Promise<T> {
  try {
    return await executeRequest<T>(method, path, body, opts);
  } catch (err) {
    // Only react to 401s on authenticated requests that haven't already
    // opted out of refresh.
    if (
      !(err instanceof ApiError) ||
      err.status !== 401 ||
      opts.unauth ||
      opts.skipRefresh
    ) {
      throw err;
    }

    const refreshed = await refreshTokenOnce();
    if (!refreshed) {
      // refreshTokenOnce already cleared the store; bubble the original
      // 401 so callers can react (e.g. surface "session expired" copy).
      throw err;
    }

    // Retry the original request exactly once. If it 401s again the
    // recursive call will see skipRefresh=true and bail.
    return executeRequest<T>(method, path, body, { ...opts, skipRefresh: true });
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, body, opts),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, undefined, opts),
};
