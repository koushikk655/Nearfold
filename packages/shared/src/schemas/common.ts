import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/u, 'Invalid phone number (E.164 format expected)');

export const latitudeSchema = z.coerce.number().min(-90).max(90);
export const longitudeSchema = z.coerce.number().min(-180).max(180);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const locationQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

export type LocationQuery = z.infer<typeof locationQuerySchema>;
