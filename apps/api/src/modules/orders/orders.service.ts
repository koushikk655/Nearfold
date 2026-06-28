import type {
  CancelOrderInput,
  CartItem,
  CreateOrderInput,
  OrderStatus,
  PaginationQuery,
  UpdateOrderStatusInput,
} from '@nearkin/shared';
import type { Order, Product } from '../../db/schema.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import { calculateOrderTotals } from '../../utils/money.js';
import { addressesRepository } from '../addresses/addresses.repository.js';
import { cartRepository } from '../cart/cart.repository.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { razorpayService } from '../payments/razorpay.service.js';
import { productsRepository } from '../products/products.repository.js';
import { sellersRepository } from '../sellers/sellers.repository.js';
import { assertValidTransition, canActorTransition } from './orders.stateMachine.js';
import { ordersRepository } from './orders.repository.js';

interface OrderItemSnapshot {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

function snapshotItems(cartItems: CartItem[], products: Product[]): OrderItemSnapshot[] {
  return cartItems.map((item) => {
    const p = products.find((x) => x.id === item.productId);
    if (!p) throw new NotFoundError(`Product ${item.productId} not found`);
    if (!p.isAvailable) throw new ValidationError(`Product ${p.name} is no longer available`);
    if (p.trackInventory && p.stockQuantity < item.quantity) {
      throw new ValidationError(`Insufficient stock for ${p.name}`);
    }
    return {
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: item.quantity,
    };
  });
}

function toApi(order: Order, statusLogs?: unknown[]) {
  return {
    id: order.id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    items: order.items,
    subtotal: order.subtotal,
    platformFee: order.platformFee,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: Number(order.deliveryLat),
    deliveryLng: Number(order.deliveryLng),
    specialInstructions: order.specialInstructions,
    cancellationReason: order.cancellationReason,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    expectedDeliveryTime: order.expectedDeliveryTime,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ...(statusLogs ? { statusLogs } : {}),
  };
}

export const ordersService = {
  /**
   * Create an order from the buyer's current cart.
   * Server recalculates ALL prices (never trust frontend).
   */
  async createFromCart(buyerId: string, input: CreateOrderInput) {
    const cart = await cartRepository.findByBuyer(buyerId);
    if (!cart) throw new ValidationError('Cart is empty');
    const cartItems = (cart.items as CartItem[]) ?? [];
    if (cartItems.length === 0) throw new ValidationError('Cart is empty');

    const seller = await sellersRepository.findById(cart.sellerId);
    if (!seller) throw new NotFoundError('Seller no longer exists');
    if (!seller.isOpen) throw new ConflictError('Shop is currently closed');

    const address = await addressesRepository.findById(input.addressId, buyerId);
    if (!address) throw new NotFoundError('Address not found');

    const products = await productsRepository.findManyByIds(cartItems.map((i) => i.productId));
    const items = snapshotItems(cartItems, products);

    const totals = calculateOrderTotals(
      items.map((i) => ({ productId: i.productId, unitPrice: i.unitPrice, quantity: i.quantity })),
    );

    if (totals.totalAmount < seller.minOrderAmount) {
      throw new ValidationError(
        `Minimum order amount for this shop is ${seller.minOrderAmount} paise`,
      );
    }

    const isCod = input.paymentMethod === 'cod';

    // Create the order in pending state.
    const order = await ordersRepository.create({
      buyerId,
      sellerId: seller.id,
      items: items as unknown as Order['items'],
      subtotal: totals.subtotal,
      platformFee: totals.platformFee,
      totalAmount: totals.totalAmount,
      status: 'pending',
      paymentStatus: isCod ? 'cod_pending' : 'pending',
      paymentMethod: input.paymentMethod,
      deliveryAddress: `${address.addressLine}, ${address.city}, ${address.state} ${address.pincode}`,
      deliveryLat: address.latitude,
      deliveryLng: address.longitude,
      specialInstructions: input.specialInstructions ?? null,
    });

    // Decrement inventory atomically per product (best effort — track_inventory products only).
    for (const item of items) {
      await productsRepository.decrementStock(item.productId, item.quantity);
    }

    let razorpayOrder: { id: string; amount: number; currency: string; receipt: string } | null = null;

    if (!isCod) {
      // Create Razorpay order; persist its id back on our order row.
      razorpayOrder = await razorpayService.createOrder({
        amountPaise: totals.totalAmount,
        receipt: order.id,
        notes: { nearkinOrderId: order.id },
      });
      const updated = await ordersRepository.setStatus(order.id, 'pending', {
        razorpayOrderId: razorpayOrder.id,
      });
      if (updated) Object.assign(order, updated);
    }

    // Clear cart after successful order creation.
    await cartRepository.clear(buyerId);

    // Notify seller about the new order.
    notificationsService
      .notifySellerNewOrder(seller.userId, { orderId: order.id, totalAmount: totals.totalAmount })
      .catch((err) => logger.warn({ err }, 'Failed to notify seller of new order'));

    return {
      order: toApi(order),
      razorpay: razorpayOrder
        ? {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: razorpayService.publicKeyId(),
          }
        : null,
    };
  },

  async getById(actorUserId: string, orderId: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');

    // Caller must be either the buyer or the seller's owning user.
    const seller = await sellersRepository.findById(order.sellerId);
    if (order.buyerId !== actorUserId && seller?.userId !== actorUserId) {
      throw new ForbiddenError('Not authorized to view this order');
    }

    const statusLogs = await ordersRepository.listStatusLogs(orderId);
    return toApi(order, statusLogs);
  },

  async listForBuyer(buyerId: string, p: PaginationQuery) {
    const offset = (p.page - 1) * p.limit;
    const rows = await ordersRepository.listForBuyer(buyerId, p.limit, offset);
    return rows.map((o) => toApi(o));
  },

  async listForSeller(userId: string, p: PaginationQuery) {
    const seller = await sellersRepository.findByUserId(userId);
    if (!seller) throw new ForbiddenError('Not a seller');
    const offset = (p.page - 1) * p.limit;
    const rows = await ordersRepository.listForSeller(seller.id, p.limit, offset);
    return rows.map((o) => toApi(o));
  },

  async sellerUpdateStatus(userId: string, orderId: string, input: UpdateOrderStatusInput) {
    const seller = await sellersRepository.findByUserId(userId);
    if (!seller) throw new ForbiddenError('Not a seller');

    const order = await ordersRepository.assertOwnedBySeller(orderId, seller.id);
    if (!order) throw new NotFoundError('Order not found');

    assertValidTransition(order.status, input.status);
    if (!canActorTransition('seller', order.status, input.status)) {
      throw new ForbiddenError('Sellers cannot perform this transition');
    }

    const extras: Partial<Order> = {};
    if (input.status === 'delivered') {
      extras.deliveredAt = new Date();
      // For COD orders, mark payment as received on delivery
      if (order.paymentMethod === 'cod') {
        await ordersRepository.setPayment(order.id, { paymentStatus: 'paid' });
      }
      await sellersRepository.incrementTotalOrders(seller.id);
    }

    const updated = await ordersRepository.setStatus(orderId, input.status, extras);
    if (!updated) throw new NotFoundError('Order not found');

    await ordersRepository.logTransition({
      orderId,
      previousStatus: order.status,
      newStatus: input.status,
      changedBy: userId,
      note: input.note,
    });

    notificationsService
      .notifyBuyerOrderStatus(order.buyerId, { orderId, status: input.status })
      .catch((err) => logger.warn({ err }, 'Failed to notify buyer of status change'));

    return toApi(updated);
  },

  async buyerCancel(userId: string, orderId: string, input: CancelOrderInput) {
    const order = await ordersRepository.assertOwnedByBuyer(orderId, userId);
    if (!order) throw new NotFoundError('Order not found');

    const next: OrderStatus = 'cancelled';
    assertValidTransition(order.status, next);
    if (!canActorTransition('buyer', order.status, next)) {
      throw new ForbiddenError('You can only cancel orders that are still pending');
    }

    const updated = await ordersRepository.setStatus(orderId, next, {
      cancellationReason: input.reason,
    });
    if (!updated) throw new NotFoundError('Order not found');

    await ordersRepository.logTransition({
      orderId,
      previousStatus: order.status,
      newStatus: next,
      changedBy: userId,
      note: input.reason,
    });

    const seller = await sellersRepository.findById(order.sellerId);
    if (seller) {
      notificationsService
        .notifySellerOrderCancelled(seller.userId, { orderId })
        .catch((err) => logger.warn({ err }, 'Failed to notify seller of cancellation'));
    }

    return toApi(updated);
  },
};
