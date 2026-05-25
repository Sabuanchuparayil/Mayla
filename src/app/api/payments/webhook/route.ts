import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import type { SubscriptionPlan, SubscriptionStatus } from '@/generated/prisma/enums';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

// ─── Stripe plan mapping ──────────────────────────────────────────────────────
const PRODUCT_TO_PLAN: Record<string, SubscriptionPlan> = {
  premium_monthly: 'GOLD',
  premium_annual:  'GOLD',
};

function stripePlanToPrisma(productKey: string): SubscriptionPlan {
  return PRODUCT_TO_PLAN[productKey] ?? 'GOLD';
}

function stripeStatusToPrisma(status: Stripe.Subscription['status']): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active:             'ACTIVE',
    past_due:           'PAST_DUE',
    canceled:           'CANCELLED',
    incomplete:         'ACTIVE',
    incomplete_expired: 'EXPIRED',
    trialing:           'ACTIVE',
    unpaid:             'PAST_DUE',
    paused:             'ACTIVE',
  };
  return map[status] ?? 'ACTIVE';
}

// ─── Handler map ──────────────────────────────────────────────────────────────

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const userId = sub.metadata['userId'];
  if (!userId) return;

  const productKey = sub.metadata['productKey'] ?? 'premium_monthly';
  const plan = stripePlanToPrisma(productKey);
  const status = stripeStatusToPrisma(sub.status);

  // current_period_* moved to items.data[0] in Stripe API 2026+
  const firstItem = sub.items.data[0];
  const periodStart = new Date((firstItem?.current_period_start ?? 0) * 1000);
  const periodEnd = new Date((firstItem?.current_period_end ?? 0) * 1000);

  await db.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      userId,
      plan,
      status,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata['userId'];
  if (!userId) return;

  await db.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, productKey, creditKey, creditAmount } = session.metadata ?? {};
  if (!userId || !productKey) return;

  // One-time purchases only — subscriptions are handled via subscription events
  if (session.mode !== 'payment') return;

  const credits = parseInt(creditAmount ?? '0', 10);
  if (!creditKey || credits <= 0) return;

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  // Idempotency guard
  if (paymentIntentId) {
    const existing = await db.purchase.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      select: { id: true },
    });
    if (existing) return;
  }

  await db.purchase.create({
    data: {
      userId,
      productId: productKey,
      productType: creditKey,
      stripePaymentIntentId: paymentIntentId,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      metadata: { creditKey, creditAmount: credits },
    },
  });
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  // Idempotency: already recorded via checkout.session.completed for session payments.
  // This handles direct PaymentIntent charges if used in future.
  if (!pi.metadata['userId'] || !pi.metadata['creditKey']) return;

  const existing = await db.purchase.findUnique({
    where: { stripePaymentIntentId: pi.id },
    select: { id: true },
  });
  if (existing) return;

  const credits = parseInt(pi.metadata['creditAmount'] ?? '0', 10);
  await db.purchase.create({
    data: {
      userId: pi.metadata['userId']!,
      productId: pi.metadata['productKey'] ?? 'unknown',
      productType: pi.metadata['creditKey']!,
      stripePaymentIntentId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      metadata: {
        creditKey: pi.metadata['creditKey'],
        creditAmount: credits,
      },
    },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // Unhandled event type — acknowledge without error
        break;
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
