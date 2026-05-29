// Shadows — soft, warm, premium feel. RN handles shadow on iOS via
// shadowColor/Offset/Opacity/Radius and on Android via elevation. We bundle
// both so each token works cross-platform.

import type { ViewStyle } from 'react-native';

type Shadow = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

// Shadow colors are intentionally warm-tinted near-black to sit naturally on
// the cream light surface and to feel less "cold" than pure #000 alpha.
const SHADOW_BASE = '#2A2018';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: SHADOW_BASE,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: SHADOW_BASE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: SHADOW_BASE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: SHADOW_BASE,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
  xl: {
    shadowColor: SHADOW_BASE,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 16,
  },
} as const satisfies Record<string, Shadow>;

export type ShadowToken = keyof typeof shadows;
