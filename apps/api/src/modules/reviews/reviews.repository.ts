import { avg, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { reviews, type Review } from '../../db/schema.js';

export const reviewsRepository = {
  async create(input: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    rating: number;
    comment?: string;
  }): Promise<Review> {
    const [created] = await db
      .insert(reviews)
      .values({
        orderId: input.orderId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .returning();
    if (!created) throw new Error('Failed to insert review');
    return created;
  },

  async findByOrder(orderId: string): Promise<Review | null> {
    const rows = await db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
    return rows[0] ?? null;
  },

  async listForSeller(sellerId: string, limit = 20, offset = 0): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async averageForSeller(sellerId: string): Promise<number> {
    const result = await db
      .select({ avg: avg(reviews.rating), count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId));
    const row = result[0];
    if (!row || !row.avg) return 0;
    return Number(row.avg);
  },
};
