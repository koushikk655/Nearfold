import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users, type User } from '../../db/schema.js';

type UserUpdate = Partial<{
  name: string;
  profilePhotoUrl: string;
  role: 'buyer' | 'seller' | 'both';
  city: string;
  currentLat: string;
  currentLng: string;
  expoPushToken: string;
}>;

export const usersRepository = {
  async findById(id: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async update(id: string, patch: UserUpdate): Promise<User> {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, id)).returning();
    if (!updated) throw new Error('User not found');
    return updated;
  },
};
