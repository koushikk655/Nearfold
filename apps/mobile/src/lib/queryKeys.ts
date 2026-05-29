// Centralized TanStack Query keys. One place to look when invalidating —
// avoids the "which array did I use for this query again?" problem and
// makes optimistic updates target the right cache entries.

export const queryKeys = {
  me: () => ['me'] as const,

  discovery: (params: {
    lat: number;
    lng: number;
    radiusKm?: number;
    category?: string;
    onlyOpen?: boolean;
  }) => ['discovery', 'nearby', params] as const,

  seller: (sellerId: string) => ['seller', sellerId] as const,
  sellerHours: (sellerId: string) => ['seller', sellerId, 'hours'] as const,
  sellerProducts: (sellerId: string) => ['seller', sellerId, 'products'] as const,
  sellerReviews: (sellerId: string) => ['seller', sellerId, 'reviews'] as const,

  product: (productId: string) => ['product', productId] as const,

  cart: () => ['cart'] as const,

  ordersMine: () => ['orders', 'mine'] as const,
  order: (orderId: string) => ['orders', orderId] as const,

  addresses: () => ['addresses'] as const,
} as const;
