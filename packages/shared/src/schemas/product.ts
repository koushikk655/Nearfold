import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().int().min(1, 'Price must be at least 1 (in paise/cents)'),
  category: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(8).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isCustomOrder: z.boolean().optional(),
  leadTimeHours: z.number().int().min(0).max(168).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
