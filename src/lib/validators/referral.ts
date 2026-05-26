import { z } from 'zod';

export const referralCodeSchema = z.object({
  code: z.string().min(4).max(16),
});

export const customizeReferralCodeSchema = z.object({
  code: z.string().min(4).max(16),
});

export const createSquadSchema = z.object({
  name: z.string().min(2).max(40),
});

export const joinSquadSchema = z.object({
  code: z.string().min(4).max(16),
});

export const updateSquadSchema = z.object({
  name: z.string().min(2).max(40),
});

export const squadVouchSchema = z.object({
  targetUserId: z.string().min(1),
});
