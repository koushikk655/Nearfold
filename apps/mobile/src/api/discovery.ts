// Discovery API — nearby sellers within delivery range of a lat/lng.
// Backend already filters to sellers whose own deliveryRadiusKm covers
// the buyer, so the client just renders what comes back.

import { api } from './client';
import type { NearbySeller } from './types';

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusKm?: number; // 0.1–50, backend default 5
  category?: string;
  onlyOpen?: boolean;
  limit?: number; // 1–100, default 50
}

export const discoveryApi = {
  nearbySellers: (p: NearbyParams) =>
    api.get<NearbySeller[]>('/discovery/nearby-sellers', {
      unauth: true,
      params: {
        lat: p.lat,
        lng: p.lng,
        radius_km: p.radiusKm,
        category: p.category,
        only_open: p.onlyOpen,
        limit: p.limit,
      },
    }),
};
