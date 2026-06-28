import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { carts, type Cart } from '../../db/schema.js';
import type { CartItem } from '@nearkin/shared';

/**
 * Repository for the persistent cart table.
 * Service-layer code is responsible for enforcing the "single seller per buyer"
 * constraint (it throws CONFLICT before reaching this layer).
 */
export const cartRepository = {
  async findByBuyer(buyerId: string): Promise<Cart | null> {
    const rows = await db.select().from(carts).where(eq(carts.buyerId, buyerId)).limit(1);
    return rows[0] ?? null;
  },

  async findByBuyerSeller(buyerId: string, sellerId: string): Promise<Cart | null> {
    const rows = await db
      .select()
      .from(carts)
      .where(and(eq(carts.buyerId, buyerId), eq(carts.sellerId, sellerId)))
      .limit(1);
    return rows[0] ?? null;
  },

  async create(buyerId: string, sellerId: string, items: CartItem[]): Promise<Cart> {
    const [created] = await db.insert(carts).values({ buyerId, sellerId, items }).returning();
    if (!created) throw new Error('Failed to create cart');
    return created;
  },

  async updateItems(cartId: string, items: CartItem[]): Promise<Cart> {
    const [updated] = await db
      .update(carts)
      .set({ items, updatedAt: new Date() })
      .where(eq(carts.id, cartId))
      .returning();
    if (!updated) throw new Error('Cart not found');
    return updated;
  },

  async clear(buyerId: string): Promise<void> {
    await db.delete(carts).where(eq(carts.buyerId, buyerId));
  },
};
