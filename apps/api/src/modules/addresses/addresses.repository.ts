import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { addresses, type Address, type NewAddress } from '../../db/schema.js';

export const addressesRepository = {
  async list(userId: string): Promise<Address[]> {
    return db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.createdAt));
  },

  async findById(id: string, userId: string): Promise<Address | null> {
    const rows = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  },

  async create(input: NewAddress): Promise<Address> {
    const [created] = await db.insert(addresses).values(input).returning();
    if (!created) throw new Error('Failed to insert address');
    return created;
  },

  async update(id: string, userId: string, patch: Partial<NewAddress>): Promise<Address | null> {
    const [updated] = await db
      .update(addresses)
      .set(patch)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();
    return updated ?? null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning({ id: addresses.id });
    return deleted.length > 0;
  },
};
