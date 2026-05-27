import { env } from '../config/env.js';

/**
 * All money values throughout the API are integers in paise (1 INR = 100 paise).
 * This avoids floating-point rounding bugs.
 *
 * Backend-only price recalculation utility — never trust client-supplied totals.
 */

export interface OrderItemInput {
  productId: string;
  unitPrice: number; // paise
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  platformFee: number;
  totalAmount: number;
}

export function calculateOrderTotals(items: OrderItemInput[]): OrderTotals {
  if (items.length === 0) {
    return { subtotal: 0, platformFee: 0, totalAmount: 0 };
  }

  const subtotal = items.reduce((sum, item) => {
    if (item.quantity < 1) throw new Error('Invalid quantity');
    if (item.unitPrice < 0) throw new Error('Invalid price');
    return sum + item.unitPrice * item.quantity;
  }, 0);

  const platformFee = Math.round((subtotal * env.PLATFORM_FEE_PERCENT) / 100);
  const totalAmount = subtotal + platformFee;

  return { subtotal, platformFee, totalAmount };
}

/** Convert paise (integer) → rupees (string with 2 decimals). For display only. */
export function paiseToRupeesDisplay(paise: number): string {
  return (paise / 100).toFixed(2);
}
