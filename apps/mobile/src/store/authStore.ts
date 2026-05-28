// Auth store — token + user, persisted to SecureStore via Zustand persist.
//
// `status` is a small state machine:
//   'idle'         → initial render; we don't yet know if a token exists
//   'hydrating'    → reading SecureStore
//   'authenticated'→ token loaded and present
//   'anonymous'    → no token; user must go through OTP flow
//
// Splits hydration from "is user logged in" so the splash screen can show
// the right thing instead of flashing the auth screen for users who ARE
// logged in.

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthUser } from '../api/auth';

export type AuthStatus = 'idle' | 'hydrating' | 'authenticated' | 'anonymous';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;

  setSession: (session: { token: string; user: AuthUser }) => void;
  clear: () => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      status: 'idle',

      setSession: ({ token, user }) =>
        set({ token, user, status: 'authenticated' }),

      clear: () => set({ token: null, user: null, status: 'anonymous' }),

      markHydrated: () =>
        set((state) => ({
          status: state.token ? 'authenticated' : 'anonymous',
        })),

      setStatus: (s) => set({ status: s }),
    }),
    {
      name: 'nearfold/auth',
      storage: createJSONStorage(() => secureStringStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (_rehydratedState, error) => {
        if (error) {
          // SecureStore can fail on simulators that don't have Keychain
          // configured. We swallow and treat as anonymous.
          // eslint-disable-next-line no-console
          console.warn('[auth] rehydrate failed', error);
        }
        // Flip status on the next tick so subscribers see populated token
        // before the status change fires.
        queueMicrotask(() => {
          useAuthStore.getState().markHydrated();
        });
      },
    },
  ),
);
