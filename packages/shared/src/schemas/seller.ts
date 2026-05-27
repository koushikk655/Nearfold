import { z } from 'zod';
import { latitudeSchema, longitudeSchema } from './common.js';

export const verificationStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const createSellerProfileSchema = z.object({
  shopName: z.string().min(2).max(150),
  shopDescription: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  shopLat: latitudeSchema,
  shopLng: longitudeSchema,
  city: z.string().min(1).max(100),
  address: z.string().min(5).max(500),
  deliveryRadiusKm: z.number().int().min(1).max(50).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  avgDeliveryMinutes: z.number().int().min(15).max(720).optional(),
});

export const updateSellerProfileSchema = createSellerProfileSchema.partial();

export const setShopOpenSchema = z.object({
  isOpen: z.boolean(),
});

export const businessHoursEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/u, 'HH:MM expected'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/u, 'HH:MM expected'),
  isClosed: z.boolean().default(false),
});

export const upsertBusinessHoursSchema = z.object({
  hours: z.array(businessHoursEntrySchema).min(1).max(7),
});

export const updateVerificationStatusSchema = z.object({
  status: verificationStatusSchema,
});

export type CreateSellerProfileInput = z.infer<typeof createSellerProfileSchema>;
export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>;
export type BusinessHoursEntry = z.infer<typeof businessHoursEntrySchema>;
export type UpsertBusinessHoursInput = z.infer<typeof upsertBusinessHoursSchema>;
