// Typography — locked type stack from Nearfold Design System v1.2.
// Serif: Fraunces (editorial, warm, narrative headings & display)
// Sans:  Inter (functional body, UI, dense product surfaces)
// Mono:  JetBrains Mono (numerics, codes, metadata)
//
// Fraunces is a variable font but we ship static weights for predictable
// rendering on RN.

import type { TextStyle } from 'react-native';

export const fontFamilies = {
  serif: {
    regular: 'Fraunces-Regular',
    medium: 'Fraunces-Medium',
    semibold: 'Fraunces-SemiBold',
    bold: 'Fraunces-Bold',
    italic: 'Fraunces-Italic',
  },
  sans: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  mono: {
    regular: 'JetBrainsMono-Regular',
    medium: 'JetBrainsMono-Medium',
    bold: 'JetBrainsMono-Bold',
  },
} as const;

// Letter spacing scales loosely with size in editorial typography.
// Negative for display, neutral for body, positive for caps/mono.
type TypeStyle = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'
>;

export const type = {
  // Display & headings — Fraunces (serif)
  display: {
    fontFamily: fontFamilies.serif.semibold,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.2,
  },
  h1: {
    fontFamily: fontFamilies.serif.semibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: fontFamilies.serif.semibold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  h3: {
    fontFamily: fontFamilies.serif.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily: fontFamilies.serif.medium,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },

  // Editorial accents — italic Fraunces for restrained emphasis
  pullQuote: {
    fontFamily: fontFamilies.serif.italic,
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: 0,
  },

  // Body — Inter (sans)
  bodyLg: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamilies.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Labels / UI — slightly heavier
  label: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSm: {
    fontFamily: fontFamilies.sans.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  // Button text
  buttonLg: {
    fontFamily: fontFamilies.sans.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0,
  },
  button: {
    fontFamily: fontFamilies.sans.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  buttonSm: {
    fontFamily: fontFamilies.sans.semibold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Mono — JetBrains Mono for numbers, codes, badges
  mono: {
    fontFamily: fontFamilies.mono.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  monoSm: {
    fontFamily: fontFamilies.mono.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypeToken = keyof typeof type;
