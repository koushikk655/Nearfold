// Users API — profile + location + push-token registration.

import { api } from './client';
import type { Me, UserRole } from './types';

export interface UpdateProfileInput {
  name?: string;
  profilePhotoUrl?: string;
  role?: UserRole;
  city?: string;
}

export const usersApi = {
  me: () => api.get<Me>('/users/me'),

  updateProfile: (input: UpdateProfileInput) => api.patch<Me>('/users/me', input),

  updateLocation: (input: { lat: number; lng: number; city?: string }) =>
    api.patch<Me>('/users/me/location', input),

  registerDeviceToken: (input: { expoPushToken: string; platform?: 'ios' | 'android' }) =>
    api.post<{ registered: true }>('/users/me/device-token', input),
};
