// useTheme — the primary hook every component reaches for. Returns the
// resolved `Theme` object directly. Use the lower-level `useThemeContext()`
// when you also need `mode` / `setMode` (e.g. the theme toggle).

import { useThemeContext } from './ThemeProvider';
import type { Theme } from './index';

export function useTheme(): Theme {
  return useThemeContext().theme;
}
