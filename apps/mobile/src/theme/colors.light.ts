// Light palette — "Premium Light" direction from Nearfold Design System v1.2.
// Source of truth: Library → "Nearfold — Design System v1.2" (front-door index),
// specifically Phase 02 Tokens and Phase 06 Hero Screens cascade.
//
// Saffron #FF8A3D is the locked single accent. Neutrals are warm-tinted to
// support the editorial / asymmetric / story-driven direction (Zepto-bold
// energy with CRED-premium restraint), not a sterile cool grey ramp.

export const lightColors = {
  // Surfaces
  bg: '#FAF8F4',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F3EFE8',
  overlay: 'rgba(20, 16, 12, 0.55)',
  scrim: 'rgba(20, 16, 12, 0.32)',

  // Text
  text: '#1A1612',
  textSecondary: '#5C544A',
  textTertiary: '#94897A',
  textInverse: '#FAF8F4',
  textOnAccent: '#1A1612',

  // Borders / dividers
  border: '#E8E3DA',
  borderStrong: '#D2CABE',
  divider: '#EFEAE0',

  // Accent — Saffron (locked)
  accent: '#FF8A3D',
  accentHover: '#F07A2D',
  accentPressed: '#DC6A22',
  accentSoft: '#FFE6D2',
  accentMuted: '#FFF4E8',

  // Semantic
  success: '#2E7D5B',
  successSoft: '#D9F0E3',
  danger: '#C0392B',
  dangerSoft: '#F8DAD5',
  warning: '#D68C1A',
  warningSoft: '#FBEBCC',
  info: '#2C6EAA',
  infoSoft: '#D7E6F2',

  // Component states
  inputBg: '#FFFFFF',
  inputBgFocus: '#FFFFFF',
  inputBorder: '#D2CABE',
  inputBorderFocus: '#FF8A3D',
  inputBorderError: '#C0392B',
  placeholder: '#A89E8D',

  // Pressables
  pressableOverlay: 'rgba(26, 22, 18, 0.06)',
  rippleColor: 'rgba(26, 22, 18, 0.08)',
} as const;

// Widen each token to `string` so the dark palette (different hex values)
// is assignable to the same shape. `keyof typeof lightColors` keeps the
// key set authoritative — add a token to light and dark must match.
export type ColorTokens = Record<keyof typeof lightColors, string>;
