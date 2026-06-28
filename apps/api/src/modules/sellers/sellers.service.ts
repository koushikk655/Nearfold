import type {
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
  VerificationStatus,
} from '@nearkin/shared';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import { sellersRepository } from './sellers.repository.js';

export function toApi(s: NonNullable<Awaited<ReturnType<typeof sellersRepository.findById>>>) {
  return {
    id: s.id,
    userId: s.userId,
    shopName: s.shopName,
    shopDescription: s.shopDescription,
    category: s.category,
    shopLat: Number(s.shopLat),
    shopLng: Number(s.shopLng),
    city: s.city,
    address: s.address,
    deliveryRadiusKm: s.deliveryRadiusKm,
    minOrderAmount: s.minOrderAmount,
    avgDeliveryMinutes: s.avgDeliveryMinutes,
    isOpen: s.isOpen,
    rating: Number(s.rating),
    totalOrders: s.totalOrders,
    verificationStatus: s.verificationStatus,
    createdAt: s.createdAt,
  };
}

export const sellersService = {
  async getMine(userId: string) {
    const seller = await sellersRepository.findByUserId(userId);
    if (!seller) throw new NotFoundError('Seller profile not found');
    return toApi(seller);
  },

  async getById(id: string) {
    const seller = await sellersRepository.findById(id);
    if (!seller) throw new NotFoundError('Seller not found');
    return toApi(seller);
  },

  async create(userId: string, input: CreateSellerProfileInput) {
    const existing = await sellersRepository.findByUserId(userId);
    if (existing) throw new ConflictError('Seller profile already exists for this user');

    const created = await sellersRepository.create({
      userId,
      shopName: input.shopName,
      shopDescription: input.shopDescription ?? null,
      category: input.category ?? null,
      shopLat: String(input.shopLat),
      shopLng: String(input.shopLng),
      city: input.city,
      address: input.address,
      ...(input.deliveryRadiusKm !== undefined ? { deliveryRadiusKm: input.deliveryRadiusKm } : {}),
      ...(input.minOrderAmount !== undefined ? { minOrderAmount: input.minOrderAmount } : {}),
      ...(input.avgDeliveryMinutes !== undefined
        ? { avgDeliveryMinutes: input.avgDeliveryMinutes }
        : {}),
    });
    return toApi(created);
  },

  async update(userId: string, input: UpdateSellerProfileInput) {
    const existing = await sellersRepository.findByUserId(userId);
    if (!existing) throw new NotFoundError('Seller profile not found');

    const updated = await sellersRepository.update(existing.id, {
      ...(input.shopName !== undefined ? { shopName: input.shopName } : {}),
      ...(input.shopDescription !== undefined ? { shopDescription: input.shopDescription } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.shopLat !== undefined ? { shopLat: String(input.shopLat) } : {}),
      ...(input.shopLng !== undefined ? { shopLng: String(input.shopLng) } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.deliveryRadiusKm !== undefined ? { deliveryRadiusKm: input.deliveryRadiusKm } : {}),
      ...(input.minOrderAmount !== undefined ? { minOrderAmount: input.minOrderAmount } : {}),
      ...(input.avgDeliveryMinutes !== undefined
        ? { avgDeliveryMinutes: input.avgDeliveryMinutes }
        : {}),
    });
    if (!updated) throw new NotFoundError('Seller profile not found');
    return toApi(updated);
  },

  async setShopOpen(userId: string, isOpen: boolean) {
    const seller = await sellersRepository.findByUserId(userId);
    if (!seller) throw new NotFoundError('Seller profile not found');
    const updated = await sellersRepository.update(seller.id, { isOpen });
    if (!updated) throw new NotFoundError('Seller profile not found');
    return toApi(updated);
  },

  async updateVerificationStatus(sellerId: string, status: VerificationStatus) {
    const updated = await sellersRepository.update(sellerId, { verificationStatus: status });
    if (!updated) throw new NotFoundError('Seller not found');
    return toApi(updated);
  },
};
