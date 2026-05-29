// Spacing — 4pt grid with named semantic steps.
// Source: Nearfold Design System v1.2 → Phase 02 Tokens.

export const spacing = {
  none: 0,
  hairline: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

export type SpacingToken = keyof typeof spacing;
