// Theme store — user's theme-mode preference (system / light / dark),
// now PERSISTED so the choice survives relaunch (Week 6).
//
// Persisted via the non-secure kv shim (not SecureStore — a theme choice
// isn't a secret and Keychain round-trips would slow startup). The actual
// light/dark resolution still happens in ThemeProvider by combining this
// preference with the OS color scheme.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import AsyncStorageShim from './asyncStorageShim';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeStore {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      hydrated: false,
      setMode: (mode) => set({ mode }),
      cycleMode: () =>
        set((state) => {
          const order: ThemeMode[] = ['system', 'light', 'dark'];
          const next = order[(order.indexOf(state.mode) + 1) % order.length];
          return { mode: next ?? 'system' };
        }),
    }),
    {
      name: 'nearfold/theme',
      storage: createJSONStorage(() => AsyncStorageShim),
      partialize: (s) => ({ mode: s.mode }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ hydrated: true });
      },
    },
  ),
);
