import { z } from 'zod';
import { latitudeSchema, longitudeSchema } from './common.js';

export const createAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  addressLine: z.string().min(5).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{4,10}$/u, 'Invalid pincode'),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
