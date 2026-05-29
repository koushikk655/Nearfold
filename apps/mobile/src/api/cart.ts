// Cart API. The backend cart is server-authoritative and persistent
// (one cart per buyer, single-seller). The mobile treats the GET /cart
// response as the source of truth and drives all mutations through these
// endpoints — see hooks/useCart.ts for the optimistic TanStack layer.

import { api } from './client';
import type { Cart } from './types';

export const cartApi = {
  get: () => api.get<Cart>('/cart'),

  addItem: (productId: string, quantity = 1) =>
    api.post<Cart>('/cart/items', { productId, quantity }),

  /** quantity 0 removes the line. */
  setItemQuantity: (productId: string, quantity: number) =>
    api.patch<Cart>('/cart/items', { productId, quantity }),

  clear: () => api.delete<{ cleared: true }>('/cart'),
};
