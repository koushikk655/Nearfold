import type { AddToCartInput, CartItem, UpdateCartItemInput } from '@nearkin/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { calculateOrderTotals } from '../../utils/money.js';
import { productsRepository } from '../products/products.repository.js';
import { sellersRepository } from '../sellers/sellers.repository.js';
import { cartRepository } from './cart.repository.js';

interface CartItemDetail {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

async function expandItems(items: CartItem[]): Promise<{
  detail: CartItemDetail[];
  totals: ReturnType<typeof calculateOrderTotals>;
}> {
  if (items.length === 0) {
    return { detail: [], totals: { subtotal: 0, platformFee: 0, totalAmount: 0 } };
  }
  const products = await productsRepository.findManyByIds(items.map((i) => i.productId));
  const detail: CartItemDetail[] = items.map((item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) throw new NotFoundError(`Product ${item.productId} not found`);
    if (!p.isAvailable) throw new ValidationError(`Product ${p.name} is unavailable`);
    if (p.trackInventory && p.stockQuantity < item.quantity) {
      throw new ValidationError(`Insufficient stock for ${p.name}`);
    }
    return {
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: item.quantity,
      lineTotal: p.price * item.quantity,
    };
  });
  const totals = calculateOrderTotals(
    detail.map((d) => ({ productId: d.productId, unitPrice: d.unitPrice, quantity: d.quantity })),
  );
  return { detail, totals };
}

export const cartService = {
  async get(buyerId: string) {
    const cart = await cartRepository.findByBuyer(buyerId);
    if (!cart) return { cart: null, items: [], totals: { subtotal: 0, platformFee: 0, totalAmount: 0 } };
    const items = (cart.items as CartItem[]) ?? [];
    const { detail, totals } = await expandItems(items);
    return {
      cart: {
        id: cart.id,
        sellerId: cart.sellerId,
        updatedAt: cart.updatedAt,
      },
      items: detail,
      totals,
    };
  },

  async addItem(buyerId: string, input: AddToCartInput) {
    const product = await productsRepository.findById(input.productId);
    if (!product) throw new NotFoundError('Product not found');
    if (!product.isAvailable) throw new ValidationError('Product is unavailable');

    const seller = await sellersRepository.findById(product.sellerId);
    if (!seller) throw new NotFoundError('Seller not found');

    const existing = await cartRepository.findByBuyer(buyerId);
    if (existing && existing.sellerId !== product.sellerId) {
      throw new ConflictError(
        'Cart belongs to a different seller. Clear cart before adding from another shop.',
        { currentSellerId: existing.sellerId, attemptedSellerId: product.sellerId },
      );
    }

    let items: CartItem[] = (existing?.items as CartItem[] | undefined) ?? [];
    const existingIdx = items.findIndex((i) => i.productId === input.productId);
    if (existingIdx >= 0) {
      items = items.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity + input.quantity } : item,
      );
    } else {
      items.push({ productId: input.productId, quantity: input.quantity });
    }

    if (existing) {
      await cartRepository.updateItems(existing.id, items);
    } else {
      await cartRepository.create(buyerId, product.sellerId, items);
    }

    return this.get(buyerId);
  },

  async updateItem(buyerId: string, input: UpdateCartItemInput) {
    const existing = await cartRepository.findByBuyer(buyerId);
    if (!existing) throw new NotFoundError('Cart is empty');

    let items = (existing.items as CartItem[]) ?? [];
    if (input.quantity === 0) {
      items = items.filter((i) => i.productId !== input.productId);
    } else {
      const idx = items.findIndex((i) => i.productId === input.productId);
      if (idx < 0) throw new NotFoundError('Product not in cart');
      items = items.map((item, i) => (i === idx ? { ...item, quantity: input.quantity } : item));
    }

    if (items.length === 0) {
      await cartRepository.clear(buyerId);
    } else {
      await cartRepository.updateItems(existing.id, items);
    }
    return this.get(buyerId);
  },

  async clear(buyerId: string) {
    await cartRepository.clear(buyerId);
    return { cleared: true };
  },

  async replaceCart(buyerId: string, sellerId: string, items: CartItem[]) {
    await cartRepository.clear(buyerId);
    if (items.length === 0) return this.get(buyerId);
    await cartRepository.create(buyerId, sellerId, items);
    return this.get(buyerId);
  },
};
