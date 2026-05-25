export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { stripe } from '@/lib/stripe';
import {
  activateSubscriptionFromStripe,
  isStripeMockMode,
  mockCancel,
  mockUpgrade,
} from '@/lib/subscription';
import { db } from '@/lib/db';

function parseTier(tier: string | undefined): 'GOLD' | 'PLATINUM' | null {
  if (tier === 'GOLD' || tier === 'PLATINUM') return tier;
  return null;
}

async function handleCheckoutCompleted(session: {
  metadata?: { userId?: string; tier?: string };
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
}) {
  const userId = session.metadata?.userId;
  const tier = parseTier(session.metadata?.tier);
  if (!userId || !tier) return;

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  await activateSubscriptionFromStripe(userId, tier, customerId, subscriptionId);
}

async function handleSubscriptionUpdated(sub: {
  metadata?: { userId?: string; tier?: string };
  status?: string;
  customer?: string | { id?: string } | null;
  id?: string;
}) {
  const userId = sub.metadata?.userId;
  const tier = parseTier(sub.metadata?.tier);
  if (!userId) return;

  if (sub.status === 'active' && tier) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
    await activateSubscriptionFromStripe(userId, tier, customerId, sub.id ?? null);
    return;
  }

  if (sub.status === 'canceled' || sub.status === 'unpaid') {
    await mockCancel(userId);
  }
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const payload = await request.text();

    if (
      isStripeMockMode() ||
      !webhookSecret ||
      webhookSecret.startsWith('whsec_placeholder') ||
      process.env.MOCK_STRIPE === 'true'
    ) {
      let mockEvent: {
        type: string;
        data?: {
          object?: {
            metadata?: { userId?: string; tier?: 'GOLD' | 'PLATINUM' };
            status?: string;
          };
        };
      } = { type: 'mock.event' };
      try {
        mockEvent = JSON.parse(payload);
      } catch {
        // ignore
      }

      if (mockEvent.type === 'checkout.session.completed') {
        await handleCheckoutCompleted(mockEvent.data?.object ?? {});
      }
      if (mockEvent.type === 'customer.subscription.updated') {
        await handleSubscriptionUpdated(mockEvent.data?.object ?? {});
      }
      if (mockEvent.type === 'customer.subscription.deleted') {
        const userId = mockEvent.data?.object?.metadata?.userId;
        if (userId) await mockCancel(userId);
      }

      return apiSuccess({ received: true, mock: true, type: mockEvent.type });
    }

    if (!signature) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Missing stripe-signature header', 400);
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Parameters<typeof handleCheckoutCompleted>[0]);
    }

    if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionUpdated(event.data.object as Parameters<typeof handleSubscriptionUpdated>[0]);
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { metadata?: { userId?: string } };
      if (sub.metadata?.userId) {
        await mockCancel(sub.metadata.userId);
      } else {
        const stripeSubId = (event.data.object as { id?: string }).id;
        if (stripeSubId) {
          await db.subscription.updateMany({
            where: { stripeSubscriptionId: stripeSubId },
            data: { tier: 'FREE', status: 'CANCELLED', expiresAt: null, stripeSubscriptionId: null },
          });
        }
      }
    }

    return apiSuccess({ received: true, type: event.type });
  } catch (error) {
    return handleApiError(error);
  }
}
