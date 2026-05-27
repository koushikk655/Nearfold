import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { otpRequests, users, type NewUser, type User } from '../../db/schema.js';

export const authRepository = {
  async findUserByPhone(phone: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return rows[0] ?? null;
  },

  async createUser(input: NewUser): Promise<User> {
    const [created] = await db.insert(users).values(input).returning();
    if (!created) throw new Error('Failed to insert user');
    return created;
  },

  async markVerified(userId: string): Promise<void> {
    await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));
  },

  async logOtpRequest(phone: string): Promise<void> {
    await db.insert(otpRequests).values({ phone });
  },

  async countOtpRequestsWithinHour(phone: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(otpRequests)
      .where(and(eq(otpRequests.phone, phone), gte(otpRequests.requestedAt, oneHourAgo)));
    return result[0]?.count ?? 0;
  },
};
