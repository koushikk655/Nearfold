// Analytics — event taxonomy + a thin façade.
//
// The taxonomy is the contract: every tracked moment in the funnel has a
// stable, snake_case name and a typed payload. The TRANSPORT is pluggable
// — today it logs in dev and drops Sentry breadcrumbs; wire a real
// provider (PostHog / Amplitude / Segment) in `deliver()` without touching
// any call sites.
//
// Why define the taxonomy now (Week 7) even before a provider: instrument
// once, at the right moments, with the right props. Retro-fitting events
// after launch always misses context.

import { addBreadcrumb } from './sentry';

export const AnalyticsEvent = {
  // Lifecycle
  AppOpen: 'app_open',
  // Auth
  SignInStarted: 'sign_in_started',
  OtpRequested: 'otp_requested',
  OtpVerified: 'otp_verified',
  SignedOut: 'signed_out',
  // Location
  LocationGranted: 'location_granted',
  LocationDenied: 'location_denied',
  // Discovery
  DiscoverViewed: 'discover_viewed',
  SearchPerformed: 'search_performed',
  CategorySelected: 'category_selected',
  SellerViewed: 'seller_viewed',
  ProductViewed: 'product_viewed',
  // Cart
  AddToCart: 'add_to_cart',
  CartViewed: 'cart_viewed',
  RemoveFromCart: 'remove_from_cart',
  CartCleared: 'cart_cleared',
  // Checkout / payment
  CheckoutStarted: 'checkout_started',
  AddressAdded: 'address_added',
  PaymentMethodSelected: 'payment_method_selected',
  OrderPlaced: 'order_placed',
  PaymentSucceeded: 'payment_succeeded',
  PaymentCancelled: 'payment_cancelled',
  PaymentFailed: 'payment_failed',
  // Orders
  OrderViewed: 'order_viewed',
  OrderCancelled: 'order_cancelled',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

let enabled = true;
let userId: string | null = null;

export function setAnalyticsUser(id: string | null) {
  userId = id;
}

export function setAnalyticsEnabled(value: boolean) {
  enabled = value;
}

/**
 * Track a funnel event. Safe to call anywhere — never throws, never blocks.
 */
export function track(event: AnalyticsEventName, props?: AnalyticsProps) {
  if (!enabled) return;
  try {
    deliver(event, props);
  } catch {
    /* analytics must never break the app */
  }
}

function deliver(event: AnalyticsEventName, props?: AnalyticsProps) {
  // Breadcrumb so the event trail appears alongside any Sentry error.
  addBreadcrumb({ category: 'analytics', message: event, data: props });

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`📊 ${event}`, props ?? {});
  }

  // TODO(provider): forward to PostHog / Amplitude / Segment here, e.g.
  //   posthog.capture(event, { ...props, userId });
  void userId;
}
