import { ORDER_STATE_TRANSITIONS, type OrderStatus } from '@nearkin/shared';
import { ConflictError } from '../../utils/errors.js';

/**
 * Enforce that `to` is a legal next status from `from`.
 * Throws ConflictError (HTTP 409) on invalid transitions.
 */
export function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  if (from === to) {
    throw new ConflictError(`Order is already in status "${from}"`);
  }
  const allowed = ORDER_STATE_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new ConflictError(
      `Invalid transition: ${from} → ${to}. Allowed from ${from}: ${
        allowed.length === 0 ? '(terminal state)' : allowed.join(', ')
      }`,
    );
  }
}

/**
 * Returns true iff the actor's role is permitted to drive a status transition.
 * Buyers can only cancel pending orders; sellers drive all other transitions.
 */
export function canActorTransition(
  actor: 'buyer' | 'seller',
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (actor === 'buyer') {
    // Buyers may only cancel an order that is still pending.
    return from === 'pending' && to === 'cancelled';
  }
  // Sellers can drive every transition (including cancel of confirmed/preparing).
  return true;
}
