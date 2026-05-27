import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const paymentMethodSchema = z.enum(['razorpay', 'cod']);

export const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: paymentMethodSchema,
  specialInstructions: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  note: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
