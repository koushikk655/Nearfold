// Auth store — token pair + user, persisted to SecureStore via Zustand persist.
//
// Shape was extended in Week 2.5 to carry the refresh-token contract that
// the backend will ship (see project doc 🔐 "Spec — Backend: /auth/refresh
// + refresh-token rotation").
//
// Tolerant migration:
//   • If the backend has shipped refresh tokens, we get all four fields
//     (accessToken, refreshToken, both expiry timestamps).
//   • If the backend still returns the legacy { token, user } shape, we
//     fall back gracefully — token is stored as the access token, no
//     refresh capability, user re-OTPs when JWT expires (current behavior).
//
// `status` is a small state machine:
//   'idle'         → initial render; we don't yet know if a token exists
//   'hydrating'    → reading SecureStore
//   'authenticated'→ token loaded and present
//   'anonymous'    → no token; user must go through OTP flow

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthUser } from '../api/auth';

export type AuthStatus = 'idle' | 'hydrating' | 'authenticated' | 'anonymous';

/** What the backend returns from /auth/verify-otp and /auth/refresh. */
export interface ServerSession {
  /** New field name. Falls back to `token` for back-compat. */
  accessToken?: string;
  /** Legacy field name (PR-A transition). */
  token?: string;
  /** Present only after the backend lands refresh tokens. */
  refreshToken?: string;
  /** ISO 8601 timestamps when present. */
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user: AuthUser;
}

interface AuthState {
  token: string | null; // access token
  refreshToken: string | null;
  user: AuthUser | null;
  /** Epoch ms. null if the backend didn't tell us. */
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  status: AuthStatus;

  /** Persist a fresh session returned by verify-otp or refresh. */
  setSession: (session: ServerSession) => void;
  /** Wipe everything (sign-out, refresh failure, 401). */
  clear: () => void;
  /** Called by the persist rehydrator after disk read. */
  markHydrated: () => void;
  setStatus: (s: AuthStatus) => void;
}

// expo-secure-store talks in strings; zustand's createJSONStorage wants
// a StateStorage with the same shape. Thin adapter.
const secureStringStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

function parseIsoMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      status: 'idle',

      setSession: (session) => {
        const access = session.accessToken ?? session.token ?? null;
        if (!access) {
          // Defensive — should never happen, but don't silently auth a user
          // without a token.
          throw new Error('setSession called without an access token');
        }
        set({
          token: access,
          refreshToken: session.refreshToken ?? null,
          user: session.user,
          accessTokenExpiresAt: parseIsoMs(session.accessTokenExpiresAt),
          refreshTokenExpiresAt: parseIsoMs(session.refreshTokenExpiresAt),
          status: 'authenticated',
        });
      },

      clear: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          status: 'anonymous',
        }),

      markHydrated: () =>
        set((state) => ({
          status: state.token ? 'authenticated' : 'anonymous',
        })),

      setStatus: (s) => set({ status: s }),
    }),
    {
      name: 'nearfold/auth',
      storage: createJSONStorage(() => secureStringStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
      }),
      onRehydrateStorage: () => (_rehydratedState, error) => {
        if (error) {
          // SecureStore can fail on simulators that don't have Keychain
          // configured. We swallow and treat as anonymous.
          // eslint-disable-next-line no-console
          console.warn('[auth] rehydrate failed', error);
        }
        queueMicrotask(() => {
          useAuthStore.getState().markHydrated();
        });
      },
    },
  ),
);
