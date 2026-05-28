// Typed fetch wrapper for the Nearfold backend.
//
// Conventions enforced here:
// - All routes live under /api/v1. The base URL comes from Constants.expoConfig.extra.
// - Auth-bearing requests inject `Authorization: Bearer <token>` from authStore.
// - Backend envelope is { success: true, data } on success and
//   { success: false, error: { code, message, details? } } on failure.
//   We unwrap success → return `data`; failure → throw `ApiError`.
// - 401 responses trigger an auth clear so the user is bounced back to /auth/phone.
//
// Used directly by api/auth.ts and (Week 3+) by TanStack Query mutations.

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
  /** Abort the request after this many ms. Default 12s. */
  timeoutMs?: number;
  /** Query string params. */
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body: unknown | undefined,
  opts: RequestOptions = {},
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

  // Auth failure → wipe local session.
  if (res.status === 401) {
    useAuthStore.getState().clear();
  }

  throw new ApiError({
    status: res.status,
    code: payload.error.code ?? 'UNKNOWN_ERROR',
    message: payload.error.message ?? `Request failed with ${res.status}.`,
    details: payload.error.details,
  });
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
