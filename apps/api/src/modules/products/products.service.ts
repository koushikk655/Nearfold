import type { CreateProductInput, UpdateProductInput } from '@nearkin/shared';
import type { Product } from '../../db/schema.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { sellersRepository } from '../sellers/sellers.repository.js';
import { productsRepository } from './products.repository.js';

export function toApi(p: Product) {
  return {
    id: p.id,
    sellerId: p.sellerId,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    images: p.images ?? [],
    stockQuantity: p.stockQuantity,
    trackInventory: p.trackInventory,
    isAvailable: p.isAvailable,
    isCustomOrder: p.isCustomOrder,
    leadTimeHours: p.leadTimeHours,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

async function getOwnedSellerId(userId: string): Promise<string> {
  const seller = await sellersRepository.findByUserId(userId);
  if (!seller) throw new ForbiddenError('You must create a seller profile first');
  return seller.id;
}

export const productsService = {
  async listBySeller(sellerId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      productsRepository.listBySeller(sellerId, limit, offset),
      productsRepository.countBySeller(sellerId),
    ]);
    return { items: rows.map(toApi), total, page, limit };
  },

  async getById(id: string) {
    const p = await productsRepository.findById(id);
    if (!p) throw new NotFoundError('Product not found');
    return toApi(p);
  },

  async create(userId: string, input: CreateProductInput) {
    const sellerId = await getOwnedSellerId(userId);
    const created = await productsRepository.create({
      sellerId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      category: input.category ?? null,
      images: input.images ?? [],
      ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
      ...(input.trackInventory !== undefined ? { trackInventory: input.trackInventory } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.isCustomOrder !== undefined ? { isCustomOrder: input.isCustomOrder } : {}),
      ...(input.leadTimeHours !== undefined ? { leadTimeHours: input.leadTimeHours } : {}),
    });
    return toApi(created);
  },

  async update(userId: string, id: string, input: UpdateProductInput) {
    const sellerId = await getOwnedSellerId(userId);
    const updated = await productsRepository.update(id, sellerId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.images !== undefined ? { images: input.images } : {}),
      ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
      ...(input.trackInventory !== undefined ? { trackInventory: input.trackInventory } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.isCustomOrder !== undefined ? { isCustomOrder: input.isCustomOrder } : {}),
      ...(input.leadTimeHours !== undefined ? { leadTimeHours: input.leadTimeHours } : {}),
    });
    if (!updated) throw new NotFoundError('Product not found');
    return toApi(updated);
  },

  async delete(userId: string, id: string) {
    const sellerId = await getOwnedSellerId(userId);
    const ok = await productsRepository.softDelete(id, sellerId);
    if (!ok) throw new NotFoundError('Product not found');
  },
};
