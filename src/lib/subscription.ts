import { db } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export type Tier = 'FREE' | 'GOLD' | 'PLATINUM';

export function isStripeMockMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.length < 20) return true;
  if (key.includes('placeholder') || key.includes('mock') || key.includes('dummy')) return true;
  return false;
}

const STRIPE_PRICES: Record<'GOLD' | 'PLATINUM', string | undefined> = {
  GOLD: process.env.STRIPE_PRICE_GOLD,
  PLATINUM: process.env.STRIPE_PRICE_PLATINUM,
};

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
    data: {
      tier: 'FREE',
      status: 'CANCELLED',
      expiresAt: null,
      stripeSubscriptionId: null,
    },
  });
}

export async function createCheckoutSession(
  userId: string,
  tier: 'GOLD' | 'PLATINUM',
  userEmail?: string | null,
): Promise<{ checkoutUrl: string | null; mock: boolean }> {
  if (isStripeMockMode()) {
    return { checkoutUrl: null, mock: true };
  }

  const priceId = STRIPE_PRICES[tier];
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${tier}. Set STRIPE_PRICE_${tier} env var.`);
  }

  await ensureSubscription(userId);
  const existing = await db.subscription.findUnique({ where: { userId } });
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  let customerId = existing?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail ?? undefined,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.subscription.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success&tier=${tier}`,
    cancel_url: `${appUrl}/settings?checkout=cancelled`,
    metadata: { userId, tier },
    subscription_data: { metadata: { userId, tier } },
  });

  return { checkoutUrl: session.url, mock: false };
}

export async function activateSubscriptionFromStripe(
  userId: string,
  tier: 'GOLD' | 'PLATINUM',
  stripeCustomerId?: string | null,
  stripeSubscriptionId?: string | null,
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'ACTIVE',
      expiresAt,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
    },
    update: {
      tier,
      status: 'ACTIVE',
      expiresAt,
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
    },
  });
}

export async function cancelSubscription(userId: string): Promise<{ mock: boolean }> {
  if (isStripeMockMode()) {
    await mockCancel(userId);
    return { mock: true };
  }

  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub?.stripeSubscriptionId) {
    await mockCancel(userId);
    return { mock: false };
  }

  const stripe = getStripe();
  await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
  await mockCancel(userId);
  return { mock: false };
}

export function tierFeatures(tier: Tier) {
  return {
    tier,
    unlimitedSwipes: tier !== 'FREE',
    seeWhoLikedYou: tier !== 'FREE',
    readReceipts: tier === 'PLATINUM',
    weeklyBoost: tier === 'PLATINUM',
    swipeLimit: SWIPE_LIMITS[tier],
    goalFilters: tier === 'FREE' ? 0 : tier === 'GOLD' ? 1 : 7,
    priorityPlacement: tier === 'PLATINUM',
    lookingForYou: tier === 'PLATINUM',
    canSeeAvailability: tier !== 'FREE',
    dateRequestsPerWeek: tier === 'FREE' ? 0 : tier === 'GOLD' ? 3 : null,
    incognitoMode: tier !== 'FREE',
    canSendGifts: tier !== 'FREE',
    premiumDreamDates: tier === 'PLATINUM',
    photoPrivacyControls: tier !== 'FREE',
  };
}
