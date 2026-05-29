// Orders API. Money fields are paise; the backend recalculates all totals
// from the server-side cart at order-create time (never trust client math).

import { api } from './client';
import type { CreateOrderResult, Order, OrderWithLogs, PaymentMethod } from './types';

export interface CreateOrderInput {
  addressId: string;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export const ordersApi = {
  create: (input: CreateOrderInput) => api.post<CreateOrderResult>('/orders', input),

  mine: (page = 1, limit = 20) =>
    api.get<Order[]>('/orders/mine', { params: { page, limit } }),

  get: (orderId: string) => api.get<OrderWithLogs>(`/orders/${orderId}`),

  cancel: (orderId: string, reason: string) =>
    api.post<Order>(`/orders/${orderId}/cancel`, { reason }),
};
