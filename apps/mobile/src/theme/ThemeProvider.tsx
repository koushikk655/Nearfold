// ThemeProvider — resolves the active Theme from (a) user mode preference
// in the Zustand store and (b) the system color scheme via `Appearance`.
//
// Resolution rules (Design System v1.2):
//   mode = 'system' → follow OS, fallback Light if OS returns null
//   mode = 'light'  → force light
//   mode = 'dark'   → force dark
//
// We also set the navigation bar & status bar background to the resolved
// surface color via expo-system-ui so the OS chrome blends with the app.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { darkTheme, lightTheme, type Theme } from './index';
import { useThemeStore, type ThemeMode } from '../store/themeStore';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(
  mode: ThemeMode,
  systemScheme: ColorSchemeName,
): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  // system → mirror OS, default Light per v1.2 spec
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const cycleMode = useThemeStore((s) => s.cycleMode);

  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(() =>
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const theme = useMemo(() => {
    const scheme = resolveScheme(mode, systemScheme);
    return scheme === 'dark' ? darkTheme : lightTheme;
  }, [mode, systemScheme]);

  useEffect(() => {
    // Blend OS chrome with the app surface to avoid flash on theme switch.
    void SystemUI.setBackgroundColorAsync(theme.colors.bg);
  }, [theme.colors.bg]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, setMode, cycleMode }),
    [theme, mode, setMode, cycleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used inside <ThemeProvider>');
  }
  return ctx;
}
