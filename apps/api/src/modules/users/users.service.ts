import type {
  RegisterDeviceTokenInput,
  UpdateUserLocationInput,
  UpdateUserProfileInput,
} from '@nearkin/shared';
import { NotFoundError } from '../../utils/errors.js';
import { usersRepository } from './users.repository.js';

function sanitize(user: NonNullable<Awaited<ReturnType<typeof usersRepository.findById>>>) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    city: user.city,
    currentLat: user.currentLat ? Number(user.currentLat) : null,
    currentLng: user.currentLng ? Number(user.currentLng) : null,
    profilePhotoUrl: user.profilePhotoUrl,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

export const usersService = {
  async getMe(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return sanitize(user);
  },

  async updateProfile(userId: string, input: UpdateUserProfileInput) {
    const updated = await usersRepository.update(userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.profilePhotoUrl !== undefined ? { profilePhotoUrl: input.profilePhotoUrl } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
    });
    return sanitize(updated);
  },

  async updateLocation(userId: string, input: UpdateUserLocationInput) {
    const updated = await usersRepository.update(userId, {
      currentLat: String(input.lat),
      currentLng: String(input.lng),
      ...(input.city ? { city: input.city } : {}),
    });
    return sanitize(updated);
  },

  async registerDeviceToken(userId: string, input: RegisterDeviceTokenInput) {
    await usersRepository.update(userId, { expoPushToken: input.expoPushToken });
    return { registered: true };
  },
};
