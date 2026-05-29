// Order hooks — create / list / detail (polling) / cancel.
//
// Tracking polls GET /orders/:id every 30s while the order is non-terminal
// (Phase: "live timeline"). Once delivered or cancelled we stop polling.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ordersApi, type CreateOrderInput } from '../api/orders';
import { queryKeys } from '../lib/queryKeys';
import { isTerminal } from '../lib/orderStatus';
import { useAuthStore } from '../store/authStore';

export function useMyOrders() {
  const authed = !!useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.ordersMine(),
    queryFn: () => ordersApi.mine(),
    enabled: authed,
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => ordersApi.get(orderId),
    // Poll every 30s until the order reaches a terminal state.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && isTerminal(data.status)) return false;
      return 30_000;
    },
    refetchIntervalInBackground: false,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: (result) => {
      // Server clears the cart on order creation — reflect that locally.
      void qc.invalidateQueries({ queryKey: queryKeys.cart() });
      void qc.invalidateQueries({ queryKey: queryKeys.ordersMine() });
      qc.setQueryData(queryKeys.order(result.order.id), {
        ...result.order,
        statusLogs: [],
      });
    },
  });
}

export function useCancelOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => ordersApi.cancel(orderId, reason),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.ordersMine() });
      return order;
    },
  });
}
