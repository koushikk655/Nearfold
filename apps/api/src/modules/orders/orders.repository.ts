import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  orderStatusLogs,
  orders,
  type NewOrder,
  type Order,
} from '../../db/schema.js';

export const ordersRepository = {
  async create(input: NewOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(input).returning();
    if (!created) throw new Error('Failed to insert order');
    return created;
  },

  async findById(id: string): Promise<Order | null> {
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, razorpayOrderId))
      .limit(1);
    return rows[0] ?? null;
  },

  async listForBuyer(buyerId: string, limit = 20, offset = 0): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async listForSeller(sellerId: string, limit = 20, offset = 0): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, sellerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async setStatus(
    id: string,
    next: Order['status'],
    extras: Partial<NewOrder> = {},
  ): Promise<Order | null> {
    const [updated] = await db
      .update(orders)
      .set({ status: next, ...extras })
      .where(eq(orders.id, id))
      .returning();
    return updated ?? null;
  },

  async setPayment(
    id: string,
    patch: Partial<Pick<NewOrder, 'paymentStatus' | 'razorpayPaymentId'>>,
  ): Promise<Order | null> {
    const [updated] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();
    return updated ?? null;
  },

  async logTransition(input: {
    orderId: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    note?: string;
  }): Promise<void> {
    await db.insert(orderStatusLogs).values({
      orderId: input.orderId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      changedBy: input.changedBy,
      note: input.note ?? null,
    });
  },

  async listStatusLogs(orderId: string) {
    return db
      .select()
      .from(orderStatusLogs)
      .where(eq(orderStatusLogs.orderId, orderId))
      .orderBy(orderStatusLogs.createdAt);
  },

  async countByStatus(sellerId: string) {
    return db
      .select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.sellerId, sellerId))
      .groupBy(orders.status);
  },

  async assertOwnedByBuyer(id: string, buyerId: string): Promise<Order | null> {
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.buyerId, buyerId)))
      .limit(1);
    return rows[0] ?? null;
  },

  async assertOwnedBySeller(id: string, sellerId: string): Promise<Order | null> {
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.sellerId, sellerId)))
      .limit(1);
    return rows[0] ?? null;
  },
};
