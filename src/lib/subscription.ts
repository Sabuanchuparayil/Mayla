import { db } from '@/lib/db';

export type Tier = 'FREE' | 'GOLD' | 'PLATINUM';

const SWIPE_LIMITS: Record<Tier, number | null> = {
  FREE: 5,
  GOLD: null,
  PLATINUM: null,
};

export async function getUserTier(userId: string): Promise<Tier> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.status !== 'ACTIVE') return 'FREE';
  if (sub.expiresAt && sub.expiresAt < new Date()) return 'FREE';
  return sub.tier;
}

export async function ensureSubscription(userId: string) {
  return db.subscription.upsert({
    where: { userId },
    create: { userId, tier: 'FREE', status: 'ACTIVE' },
    update: {},
  });
}

export function getSwipeLimit(tier: Tier): number | null {
  return SWIPE_LIMITS[tier];
}

export async function mockUpgrade(userId: string, tier: 'GOLD' | 'PLATINUM') {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return db.subscription.upsert({
    where: { userId },
    create: { userId, tier, status: 'ACTIVE', expiresAt },
    update: { tier, status: 'ACTIVE', expiresAt },
  });
}

export async function mockCancel(userId: string) {
  return db.subscription.update({
    where: { userId },
    data: { tier: 'FREE', status: 'CANCELLED', expiresAt: null },
  });
}

export function tierFeatures(tier: Tier) {
  return {
    tier,
    unlimitedSwipes: tier !== 'FREE',
    seeWhoLikedYou: tier !== 'FREE',
    readReceipts: tier === 'PLATINUM',
    weeklyBoost: tier === 'PLATINUM',
    swipeLimit: SWIPE_LIMITS[tier],
  };
}
