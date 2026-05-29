// Order status presentation helpers. The backend enforces the state
// machine; the mobile only needs to render it. Keep labels warm and human
// (brand voice), not enum-y.

import type { Ionicons } from '@expo/vector-icons';
import type { OrderStatus, PaymentStatus } from '../api/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** The happy-path progression shown as a timeline. `cancelled` is off-path. */
export const STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing your order',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_SUBTITLE: Record<OrderStatus, string> = {
  pending: 'Waiting for the maker to accept',
  confirmed: 'The maker accepted your order',
  preparing: 'Being made fresh right now',
  out_for_delivery: 'Your order is heading to you',
  delivered: 'Enjoy! ',
  cancelled: 'This order was cancelled',
};

export const STATUS_ICON: Record<OrderStatus, IoniconName> = {
  pending: 'receipt-outline',
  confirmed: 'checkmark-circle-outline',
  preparing: 'restaurant-outline',
  out_for_delivery: 'bicycle-outline',
  delivered: 'home-outline',
  cancelled: 'close-circle-outline',
};

export function statusStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.indexOf(status);
}

export function isTerminal(status: OrderStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}

export function isCancellable(status: OrderStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
  cod_pending: 'Cash on delivery',
};
