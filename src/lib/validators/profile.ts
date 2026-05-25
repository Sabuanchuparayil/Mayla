import { z } from 'zod';

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  gender: z.string().max(30).nullable().optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
  photos: z.array(z.string().max(2048)).max(6).optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().length(2).optional(),
  travelModeEnabled: z.boolean().optional(),
  travelCity: z.string().max(100).nullable().optional(),
  travelLatitude: z.number().min(-90).max(90).nullable().optional(),
  travelLongitude: z.number().min(-180).max(180).nullable().optional(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().max(100).optional(),
});

export const blockSchema = z.object({
  userId: z.string().min(1),
});

export const reportSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(3).max(200),
  details: z.string().max(1000).optional(),
});

export const checkoutSchema = z.object({
  tier: z.enum(['GOLD', 'PLATINUM']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
