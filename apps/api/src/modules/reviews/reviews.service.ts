import type { CreateReviewInput, PaginationQuery } from '@nearkin/shared';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { ordersRepository } from '../orders/orders.repository.js';
import { sellersRepository } from '../sellers/sellers.repository.js';
import { reviewsRepository } from './reviews.repository.js';

export const reviewsService = {
  async create(buyerId: string, input: CreateReviewInput) {
    const order = await ordersRepository.findById(input.orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.buyerId !== buyerId) throw new ForbiddenError('Not your order');
    if (order.status !== 'delivered') {
      throw new ConflictError('Only delivered orders can be reviewed');
    }
    const existing = await reviewsRepository.findByOrder(order.id);
    if (existing) throw new ConflictError('Order already reviewed');

    const review = await reviewsRepository.create({
      orderId: order.id,
      buyerId,
      sellerId: order.sellerId,
      rating: input.rating,
      comment: input.comment,
    });

    // Recompute and persist aggregate rating on the seller profile.
    const avg = await reviewsRepository.averageForSeller(order.sellerId);
    await sellersRepository.setRating(order.sellerId, avg);

    return {
      id: review.id,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  },

  async listForSeller(sellerId: string, p: PaginationQuery) {
    const offset = (p.page - 1) * p.limit;
    const rows = await reviewsRepository.listForSeller(sellerId, p.limit, offset);
    return rows.map((r) => ({
      id: r.id,
      buyerId: r.buyerId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  },
};
