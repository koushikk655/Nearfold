// Addresses API — delivery addresses scoped to the authenticated user.

import { api } from './client';
import type { Address } from './types';

export interface AddressInput {
  label?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export const addressesApi = {
  list: () => api.get<Address[]>('/addresses'),
  create: (input: AddressInput) => api.post<Address>('/addresses', input),
  update: (id: string, input: Partial<AddressInput>) => api.patch<Address>(`/addresses/${id}`, input),
  remove: (id: string) => api.delete<void>(`/addresses/${id}`),
};
