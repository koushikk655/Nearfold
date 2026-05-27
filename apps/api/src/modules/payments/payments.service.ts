import type { Order } from '../../db/schema.js';
import { ForbiddenError, NotFoundError, PaymentError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { ordersRepository } from '../orders/orders.repository.js';
import { razorpayService } from './razorpay.service.js';

export const paymentsService = {
  /**
   * Verify a payment from the client's onSuccess callback.
   * (The webhook is the authoritative source; this endpoint exists to give
   * the buyer instant feedback in-app.)
   */
  async verifyClientPayment(input: {
    actorUserId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const order = await ordersRepository.findByRazorpayOrderId(input.razorpayOrderId);
    if (!order) throw new NotFoundError('Order not found for this Razorpay order id');
    if (order.buyerId !== input.actorUserId) {
      throw new ForbiddenError('Not authorized to verify this payment');
    }

    const valid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    });
    if (!valid) throw new PaymentError('Signature mismatch');

    await ordersRepository.setPayment(order.id, {
      paymentStatus: 'paid',
      razorpayPaymentId: input.razorpayPaymentId,
    });

    return { verified: true, orderId: order.id };
  },

  /**
   * Handle a verified Razorpay webhook event. Idempotent — repeated deliveries
   * for the same event leave the order in the same final state.
   */
  async handleWebhookEvent(event: {
    event: string;
    payload: Record<string, unknown>;
  }) {
    logger.info({ event: event.event }, 'Processing Razorpay webhook event');

    const eventName = event.event;
    if (
      eventName === 'payment.captured' ||
      eventName === 'order.paid' ||
      eventName === 'payment.authorized'
    ) {
      // Locate the order via razorpay_order_id in the payload.
      const payment = (event.payload as { payment?: { entity?: Record<string, unknown> } }).payment
        ?.entity;
      const orderEntity = (event.payload as { order?: { entity?: Record<string, unknown> } }).order
        ?.entity;
      const razorpayOrderId = (payment?.order_id as string | undefined) ?? (orderEntity?.id as string | undefined);
      const razorpayPaymentId = payment?.id as string | undefined;
      if (!razorpayOrderId) {
        logger.warn({ event }, 'Webhook event missing razorpay_order_id');
        return { handled: false };
      }
      const order = await ordersRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!order) {
        logger.warn({ razorpayOrderId }, 'Webhook for unknown order');
        return { handled: false };
      }
      await ordersRepository.setPayment(order.id, {
        paymentStatus: 'paid',
        ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      });

      // Auto-advance pending → confirmed on payment success.
      if (order.status === 'pending') {
        await ordersRepository.setStatus(order.id, 'confirmed');
        await ordersRepository.logTransition({
          orderId: order.id,
          previousStatus: 'pending',
          newStatus: 'confirmed',
          changedBy: order.buyerId,
          note: 'Auto-confirmed on Razorpay payment success',
        });
        notificationsService
          .notifyBuyerOrderStatus(order.buyerId, { orderId: order.id, status: 'confirmed' })
          .catch(() => undefined);
      }

      return { handled: true, orderId: order.id };
    }

    if (eventName === 'payment.failed') {
      const payment = (event.payload as { payment?: { entity?: Record<string, unknown> } }).payment
        ?.entity;
      const razorpayOrderId = payment?.order_id as string | undefined;
      if (!razorpayOrderId) return { handled: false };
      const order = await ordersRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!order) return { handled: false };
      await ordersRepository.setPayment(order.id, { paymentStatus: 'failed' });
      return { handled: true, orderId: order.id };
    }

    if (eventName === 'refund.created' || eventName === 'refund.processed') {
      const refund = (event.payload as { refund?: { entity?: Record<string, unknown> } }).refund
        ?.entity;
      const paymentId = refund?.payment_id as string | undefined;
      if (!paymentId) return { handled: false };
      // Find order by payment_id
      logger.info({ paymentId }, 'Refund event — manual reconciliation may be needed');
      return { handled: true };
    }

    logger.info({ event: eventName }, 'Unhandled webhook event type — acknowledged anyway');
    return { handled: true };
  },

  async getOrderPaymentSummary(actorUserId: string, orderId: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.buyerId !== actorUserId) throw new ForbiddenError('Not authorized');
    return {
      orderId: order.id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
    } satisfies {
      orderId: string;
      totalAmount: Order['totalAmount'];
      paymentStatus: Order['paymentStatus'];
      paymentMethod: Order['paymentMethod'];
      razorpayOrderId: Order['razorpayOrderId'];
      razorpayPaymentId: Order['razorpayPaymentId'];
    };
  },
};
