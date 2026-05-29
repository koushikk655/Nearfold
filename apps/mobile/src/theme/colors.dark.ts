// Dark palette — "Premium Dark" direction from Nearfold Design System v1.2.
// Source of truth: Library → "Nearfold — Design System v1.2", Phase 02 Tokens.
//
// Background is a deep warm-black (not pure #000), surfaces step up in luminance
// for elevation hierarchy. Accent shifts slightly brighter to maintain WCAG AA
// contrast against dark surfaces.

import type { ColorTokens } from './colors.light';

export const darkColors: ColorTokens = {
  // Surfaces — warm near-black ladder
  bg: '#0E0B08',
  surface: '#1A1612',
  surfaceElevated: '#221C16',
  surfaceMuted: '#15110D',
  overlay: 'rgba(0, 0, 0, 0.72)',
  scrim: 'rgba(0, 0, 0, 0.55)',

  // Text
  text: '#F4EFE6',
  textSecondary: '#B8AC9A',
  textTertiary: '#7A6F5F',
  textInverse: '#1A1612',
  textOnAccent: '#1A1612',

  // Borders / dividers
  border: '#2E2620',
  borderStrong: '#403429',
  divider: '#241E18',

  // Accent — Saffron tuned for dark
  accent: '#FF9A4F',
  accentHover: '#FFAA66',
  accentPressed: '#E08032',
  accentSoft: '#3D2616',
  accentMuted: '#251812',

  // Semantic — adjusted luminance for dark
  success: '#4FAA80',
  successSoft: '#1A3327',
  danger: '#E07060',
  dangerSoft: '#3A1A15',
  warning: '#E8A845',
  warningSoft: '#3A2A10',
  info: '#5A9CD8',
  infoSoft: '#152838',

  // Component states
  inputBg: '#1A1612',
  inputBgFocus: '#221C16',
  inputBorder: '#403429',
  inputBorderFocus: '#FF9A4F',
  inputBorderError: '#E07060',
  placeholder: '#6B6052',

  // Pressables
  pressableOverlay: 'rgba(244, 239, 230, 0.08)',
  rippleColor: 'rgba(244, 239, 230, 0.12)',
};
