import { z } from 'zod';
import { latitudeSchema, longitudeSchema, phoneSchema } from './common.js';

export const userRoleSchema = z.enum(['buyer', 'seller', 'both']);

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  firebaseIdToken: z.string().min(10, 'Firebase ID token required'),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profilePhotoUrl: z.string().url().optional(),
  role: userRoleSchema.optional(),
  city: z.string().min(1).max(100).optional(),
});

export const updateUserLocationSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  city: z.string().min(1).max(100).optional(),
});

export const registerDeviceTokenSchema = z.object({
  expoPushToken: z.string().min(10),
  platform: z.enum(['ios', 'android']).optional(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserLocationInput = z.infer<typeof updateUserLocationSchema>;
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
