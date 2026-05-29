// Theme aggregate — single import surface for components.
// Components consume `useTheme()` and read `theme.colors.accent`, etc. They
// must NEVER hardcode colors, spacing, or radii — that is the design system
// pattern we enforce throughout the app.

import { lightColors, type ColorTokens } from './colors.light';
import { darkColors } from './colors.dark';
import { spacing } from './spacing';
import { radii } from './radii';
import { type, fontFamilies } from './typography';
import { shadows } from './shadows';

export type ColorScheme = 'light' | 'dark';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  type: typeof type;
  fontFamilies: typeof fontFamilies;
  shadows: typeof shadows;
}

export const lightTheme: Theme = {
  scheme: 'light',
  colors: lightColors,
  spacing,
  radii,
  type,
  fontFamilies,
  shadows,
};

export const darkTheme: Theme = {
  scheme: 'dark',
  colors: darkColors,
  spacing,
  radii,
  type,
  fontFamilies,
  shadows,
};

export const themes = { light: lightTheme, dark: darkTheme } as const;

export { lightColors } from './colors.light';
export { darkColors } from './colors.dark';
export type { ColorTokens } from './colors.light';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { radii } from './radii';
export type { RadiusToken } from './radii';
export { type, fontFamilies } from './typography';
export type { TypeToken } from './typography';
export { shadows } from './shadows';
export type { ShadowToken } from './shadows';
