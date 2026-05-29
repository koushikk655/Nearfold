// useCart — TanStack Query cart state + optimistic mutations.
//
// Why Query and not a Zustand mirror: the backend cart is already
// persistent and authoritative (single-seller, server-recalculated
// totals). Mirroring it in Zustand would create two sources of truth that
// drift on every concurrent change. Instead we keep ONE cache entry
// (queryKeys.cart) and mutate it optimistically for snappy UI, then
// reconcile with the server response.
//
// Optimistic strategy: update item quantities + subtotal immediately;
// platformFee / totalAmount are server-computed, so we approximate
// (subtotal + current fee) until the mutation settles and we get exact
// numbers back.

import { useCallback } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { cartApi } from '../api/cart';
import { ApiError } from '../api/client';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/authStore';
import type { Cart, CartItem } from '../api/types';

const EMPTY_CART: Cart = {
  cart: null,
  items: [],
  totals: { subtotal: 0, platformFee: 0, totalAmount: 0 },
};

function recompute(items: CartItem[], prevFee: number): Cart['totals'] {
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  // Fee is server-authoritative; keep the previous value as an approximation
  // until the real response lands.
  const platformFee = items.length > 0 ? prevFee : 0;
  return { subtotal, platformFee, totalAmount: subtotal + platformFee };
}

export function useCart() {
  const authed = !!useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.cart(),
    queryFn: cartApi.get,
    enabled: authed,
    staleTime: 10_000,
  });
}

/** Derived helpers off the cart cache without subscribing a component to
 *  the whole object when it only needs a count. */
export function useCartCount(): number {
  const { data } = useCart();
  return (data?.items ?? []).reduce((n, it) => n + it.quantity, 0);
}

export function useCartItemQty(productId: string): number {
  const { data } = useCart();
  return data?.items.find((i) => i.productId === productId)?.quantity ?? 0;
}

interface OptimisticCtx {
  previous: Cart | undefined;
}

function optimisticItemUpdate(
  qc: QueryClient,
  productId: string,
  nextQty: number,
  meta?: { name?: string; unitPrice?: number },
): OptimisticCtx {
  const previous = qc.getQueryData<Cart>(queryKeys.cart());
  const base = previous ?? EMPTY_CART;

  const existing = base.items.find((i) => i.productId === productId);
  let items: CartItem[];
  if (existing) {
    items =
      nextQty <= 0
        ? base.items.filter((i) => i.productId !== productId)
        : base.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: nextQty, lineTotal: i.unitPrice * nextQty }
              : i,
          );
  } else if (nextQty > 0 && meta?.unitPrice != null) {
    items = [
      ...base.items,
      {
        productId,
        name: meta.name ?? 'Item',
        unitPrice: meta.unitPrice,
        quantity: nextQty,
        lineTotal: meta.unitPrice * nextQty,
      },
    ];
  } else {
    items = base.items;
  }

  qc.setQueryData<Cart>(queryKeys.cart(), {
    ...base,
    items,
    totals: recompute(items, base.totals.platformFee),
  });

  return { previous };
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }: { productId: string; quantity?: number; name?: string; unitPrice?: number }) =>
      cartApi.addItem(productId, quantity),
    onMutate: async ({ productId, quantity = 1, name, unitPrice }) => {
      await qc.cancelQueries({ queryKey: queryKeys.cart() });
      const current = qc.getQueryData<Cart>(queryKeys.cart());
      const existingQty = current?.items.find((i) => i.productId === productId)?.quantity ?? 0;
      return optimisticItemUpdate(qc, productId, existingQty + quantity, { name, unitPrice });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.cart(), ctx.previous);
    },
    onSuccess: (fresh) => {
      qc.setQueryData(queryKeys.cart(), fresh);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart() });
    },
  });
}

export function useSetCartQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.setItemQuantity(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await qc.cancelQueries({ queryKey: queryKeys.cart() });
      return optimisticItemUpdate(qc, productId, quantity);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.cart(), ctx.previous);
    },
    onSuccess: (fresh) => {
      qc.setQueryData(queryKeys.cart(), fresh);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart() });
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => {
      qc.setQueryData(queryKeys.cart(), EMPTY_CART);
      void qc.invalidateQueries({ queryKey: queryKeys.cart() });
    },
  });
}

/**
 * Add-to-cart with single-seller conflict handling. The backend returns
 * 409 when the product belongs to a different seller than the current
 * cart. This wrapper surfaces that as a typed outcome so the caller can
 * prompt "clear cart & add?".
 */
export function useAddToCartWithConflict() {
  const add = useAddToCart();
  const clear = useClearCart();

  const tryAdd = useCallback(
    async (args: {
      productId: string;
      quantity?: number;
      name?: string;
      unitPrice?: number;
    }): Promise<{ ok: true } | { ok: false; reason: 'different-seller' } | { ok: false; reason: 'error'; error: unknown }> => {
      try {
        await add.mutateAsync(args);
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { ok: false, reason: 'different-seller' };
        }
        return { ok: false, reason: 'error', error: err };
      }
    },
    [add],
  );

  const clearThenAdd = useCallback(
    async (args: { productId: string; quantity?: number; name?: string; unitPrice?: number }) => {
      await clear.mutateAsync();
      await add.mutateAsync(args);
    },
    [add, clear],
  );

  return { tryAdd, clearThenAdd, isPending: add.isPending || clear.isPending };
}
