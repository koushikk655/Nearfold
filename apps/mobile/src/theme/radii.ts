// Border radii — tuned for v1.2 cascade (warm asymmetric, premium).
// Source: Nearfold Design System v1.2 → Phase 02 Tokens, Phase 07 Components.

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  pill: 999,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
