import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { sellerProfiles, type NewSellerProfile, type SellerProfile } from '../../db/schema.js';

export const sellersRepository = {
  async findById(id: string): Promise<SellerProfile | null> {
    const rows = await db
      .select()
      .from(sellerProfiles)
      .where(and(eq(sellerProfiles.id, id), isNull(sellerProfiles.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async findByUserId(userId: string): Promise<SellerProfile | null> {
    const rows = await db
      .select()
      .from(sellerProfiles)
      .where(and(eq(sellerProfiles.userId, userId), isNull(sellerProfiles.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async create(input: NewSellerProfile): Promise<SellerProfile> {
    const [created] = await db.insert(sellerProfiles).values(input).returning();
    if (!created) throw new Error('Failed to insert seller profile');
    return created;
  },

  async update(id: string, patch: Partial<NewSellerProfile>): Promise<SellerProfile | null> {
    const [updated] = await db
      .update(sellerProfiles)
      .set(patch)
      .where(eq(sellerProfiles.id, id))
      .returning();
    return updated ?? null;
  },

  async softDelete(id: string): Promise<void> {
    await db
      .update(sellerProfiles)
      .set({ deletedAt: new Date() })
      .where(eq(sellerProfiles.id, id));
  },

  async incrementTotalOrders(id: string): Promise<void> {
    const seller = await this.findById(id);
    if (!seller) return;
    await db
      .update(sellerProfiles)
      .set({ totalOrders: seller.totalOrders + 1 })
      .where(eq(sellerProfiles.id, id));
  },

  async setRating(id: string, rating: number): Promise<void> {
    await db
      .update(sellerProfiles)
      .set({ rating: rating.toFixed(2) })
      .where(eq(sellerProfiles.id, id));
  },
};
