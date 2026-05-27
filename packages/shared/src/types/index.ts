/**
 * Shared enum-like string literal unions used across backend and (future) mobile.
 * Keep these in sync with the Drizzle schema in apps/api/src/db/schema.ts.
 */

export type UserRole = 'buyer' | 'seller' | 'both';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';

export type PaymentMethod = 'razorpay' | 'cod';

/**
 * Allowed transitions in the order state machine.
 * Enforced server-side; any other transition returns HTTP 409.
 */
export const ORDER_STATE_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** Generic API response envelope used by all endpoints. */
export type ApiResponse<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string; details?: unknown } };
