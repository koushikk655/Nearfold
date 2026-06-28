import { eq } from 'drizzle-orm';
import type { UpsertBusinessHoursInput } from '@nearkin/shared';
import { db } from '../../db/client.js';
import { sellerBusinessHours } from '../../db/schema.js';
import { NotFoundError } from '../../utils/errors.js';
import { sellersRepository } from '../sellers/sellers.repository.js';

export const businessHoursService = {
  async list(sellerId: string) {
    return db
      .select()
      .from(sellerBusinessHours)
      .where(eq(sellerBusinessHours.sellerId, sellerId));
  },

  async upsertForOwner(userId: string, input: UpsertBusinessHoursInput) {
    const seller = await sellersRepository.findByUserId(userId);
    if (!seller) throw new NotFoundError('Seller profile not found');

    // Replace strategy — delete all existing, insert new.
    await db.delete(sellerBusinessHours).where(eq(sellerBusinessHours.sellerId, seller.id));

    if (input.hours.length === 0) return [];

    await db.insert(sellerBusinessHours).values(
      input.hours.map((h) => ({
        sellerId: seller.id,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed ?? false,
      })),
    );

    return this.list(seller.id);
  },
};
