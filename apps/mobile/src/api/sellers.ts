// Sellers API — public shop detail + business hours.

import { api } from './client';
import type { BusinessHour, SellerProfile } from './types';

export const sellersApi = {
  get: (sellerId: string) =>
    api.get<SellerProfile>(`/sellers/${sellerId}`, { unauth: true }),

  hours: (sellerId: string) =>
    api.get<BusinessHour[]>(`/business-hours/seller/${sellerId}`, { unauth: true }),
};
