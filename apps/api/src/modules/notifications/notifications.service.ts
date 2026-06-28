import type { OrderStatus } from '@nearkin/shared';
import { usersRepository } from '../users/users.repository.js';
import { logger } from '../../utils/logger.js';
import { sendPushNotifications } from './expoPush.js';

const STATUS_COPY: Record<OrderStatus, { title: string; body: (id: string) => string }> = {
  pending: { title: 'Order placed', body: (id) => `Order ${id.slice(0, 8)} awaiting confirmation.` },
  confirmed: {
    title: 'Order confirmed',
    body: (id) => `Your order ${id.slice(0, 8)} has been confirmed.`,
  },
  preparing: {
    title: 'Order being prepared',
    body: (id) => `The seller is preparing your order ${id.slice(0, 8)}.`,
  },
  out_for_delivery: {
    title: 'Out for delivery',
    body: (id) => `Your order ${id.slice(0, 8)} is on the way.`,
  },
  delivered: {
    title: 'Order delivered',
    body: (id) => `Your order ${id.slice(0, 8)} has been delivered. Enjoy!`,
  },
  cancelled: { title: 'Order cancelled', body: (id) => `Order ${id.slice(0, 8)} was cancelled.` },
};

async function pushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const user = await usersRepository.findById(userId);
  if (!user?.expoPushToken) {
    logger.debug({ userId }, 'No expo push token for user, skipping notification');
    return;
  }
  await sendPushNotifications([{ to: user.expoPushToken, title, body, data }]);
}

export const notificationsService = {
  async notifySellerNewOrder(
    sellerUserId: string,
    payload: { orderId: string; totalAmount: number },
  ): Promise<void> {
    await pushToUser(
      sellerUserId,
      'New order received',
      `New order ${payload.orderId.slice(0, 8)} — ₹${(payload.totalAmount / 100).toFixed(2)}`,
      { type: 'new_order', orderId: payload.orderId },
    );
  },

  async notifyBuyerOrderStatus(
    buyerUserId: string,
    payload: { orderId: string; status: OrderStatus },
  ): Promise<void> {
    const copy = STATUS_COPY[payload.status];
    await pushToUser(buyerUserId, copy.title, copy.body(payload.orderId), {
      type: 'order_status',
      orderId: payload.orderId,
      status: payload.status,
    });
  },

  async notifySellerOrderCancelled(
    sellerUserId: string,
    payload: { orderId: string },
  ): Promise<void> {
    await pushToUser(
      sellerUserId,
      'Order cancelled',
      `Buyer cancelled order ${payload.orderId.slice(0, 8)}.`,
      { type: 'order_cancelled', orderId: payload.orderId },
    );
  },
};
