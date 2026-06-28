import type { CreateAddressInput, UpdateAddressInput } from '@nearkin/shared';
import { NotFoundError } from '../../utils/errors.js';
import { addressesRepository } from './addresses.repository.js';

function toApi(addr: Awaited<ReturnType<typeof addressesRepository.list>>[number]) {
  return {
    id: addr.id,
    label: addr.label,
    addressLine: addr.addressLine,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    latitude: Number(addr.latitude),
    longitude: Number(addr.longitude),
    createdAt: addr.createdAt,
  };
}

export const addressesService = {
  async list(userId: string) {
    const rows = await addressesRepository.list(userId);
    return rows.map(toApi);
  },

  async create(userId: string, input: CreateAddressInput) {
    const created = await addressesRepository.create({
      userId,
      label: input.label ?? null,
      addressLine: input.addressLine,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      latitude: String(input.latitude),
      longitude: String(input.longitude),
    });
    return toApi(created);
  },

  async update(userId: string, id: string, input: UpdateAddressInput) {
    const updated = await addressesRepository.update(id, userId, {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.pincode !== undefined ? { pincode: input.pincode } : {}),
      ...(input.latitude !== undefined ? { latitude: String(input.latitude) } : {}),
      ...(input.longitude !== undefined ? { longitude: String(input.longitude) } : {}),
    });
    if (!updated) throw new NotFoundError('Address not found');
    return toApi(updated);
  },

  async delete(userId: string, id: string) {
    const ok = await addressesRepository.delete(id, userId);
    if (!ok) throw new NotFoundError('Address not found');
  },
};
