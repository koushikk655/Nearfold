import { z } from 'zod';

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
