// Products API — list by seller (paginated) + single product detail.

import { api } from './client';
import type { Product } from './types';

export const productsApi = {
  bySeller: (sellerId: string, page = 1, limit = 50) =>
    api.get<Product[]>(`/products/seller/${sellerId}`, {
      unauth: true,
      params: { page, limit },
    }),

  get: (productId: string) =>
    api.get<Product>(`/products/${productId}`, { unauth: true }),
};
