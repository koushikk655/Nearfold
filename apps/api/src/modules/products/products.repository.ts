import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { products, type NewProduct, type Product } from '../../db/schema.js';

export const productsRepository = {
  async listBySeller(sellerId: string, limit = 50, offset = 0): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, sellerId), isNull(products.deletedAt)))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countBySeller(sellerId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.sellerId, sellerId), isNull(products.deletedAt)));
    return result[0]?.count ?? 0;
  },

  async findById(id: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async findManyByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    return db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), isNull(products.deletedAt)));
  },

  async create(input: NewProduct): Promise<Product> {
    const [created] = await db.insert(products).values(input).returning();
    if (!created) throw new Error('Failed to insert product');
    return created;
  },

  async update(id: string, sellerId: string, patch: Partial<NewProduct>): Promise<Product | null> {
    const [updated] = await db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerId)))
      .returning();
    return updated ?? null;
  },

  async softDelete(id: string, sellerId: string): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.sellerId, sellerId)))
      .returning({ id: products.id });
    return result.length > 0;
  },

  async decrementStock(id: string, qty: number): Promise<void> {
    await db
      .update(products)
      .set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${qty}, 0)` })
      .where(and(eq(products.id, id), eq(products.trackInventory, true)));
  },
};
