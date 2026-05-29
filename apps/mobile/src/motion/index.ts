// Motion tokens — durations, easings, springs.
// Source: Nearfold Design System v1.2 → Phase 03 Motion Language.
//
// Design intent: "restrained but alive". Most micro-interactions land in
// 120–200ms with a decelerating curve so they feel intentional without
// stealing attention. Springs are used for tactile feedback (chips,
// sheet drag, image scrub) where physics reads as personality.
//
// Tokens are consumable both by Moti (timing/spring config objects) and
// directly by Reanimated 3 (withTiming / withSpring).

import { Easing } from 'react-native-reanimated';

// ────────────────────────────────────────────────────────────────────
// Durations (ms)
// ────────────────────────────────────────────────────────────────────
export const durations = {
  instant: 0,
  micro: 120, // hover-equivalent, ripple, focus halo
  short: 200, // button press, chip select, small enter/exit
  medium: 320, // card expand, list item insert
  long: 500, // sheet open, route transition
  xl: 800, // hero entrance, story reveal
} as const;

export type DurationToken = keyof typeof durations;

// ────────────────────────────────────────────────────────────────────
// Easings — bezier curves named by intent
// ────────────────────────────────────────────────────────────────────
export const easings = {
  // Material standard — symmetric, safe default
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  // Decelerate — element enters from off-screen / appears
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  // Accelerate — element exits / disappears
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  // Emphasized — slightly more dramatic standard, for hero moments
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1),
  // Linear — for crossfades and continuous motion
  linear: Easing.linear,
} as const;

export type EasingToken = keyof typeof easings;

// ────────────────────────────────────────────────────────────────────
// Spring presets — Moti / Reanimated compatible
// ────────────────────────────────────────────────────────────────────
// `damping` controls oscillation (higher = less wobble).
// `mass` and `stiffness` together set the period and snappiness.
export const springs = {
  // Snappy — buttons, chips, fast taps. Almost no overshoot.
  snappy: { damping: 22, mass: 0.7, stiffness: 380 },
  // Gentle — cards, sheets. Soft settle, mild overshoot.
  gentle: { damping: 18, mass: 1, stiffness: 220 },
  // Bouncy — playful, emoji-style reactions. Visible bounce.
  bouncy: { damping: 12, mass: 0.9, stiffness: 320 },
  // Soft — drag releases, scrolly hand-offs. Long, slow settle.
  soft: { damping: 26, mass: 1.4, stiffness: 140 },
} as const;

export type SpringToken = keyof typeof springs;

// Pre-baked timing configs (Moti-friendly).
export const timings = {
  micro: { duration: durations.micro, easing: easings.standard },
  short: { duration: durations.short, easing: easings.decelerate },
  medium: { duration: durations.medium, easing: easings.emphasized },
  long: { duration: durations.long, easing: easings.emphasized },
} as const;

export type TimingToken = keyof typeof timings;
