export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { stripe } from '@/lib/stripe';
import { mockUpgrade } from '@/lib/subscription';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const payload = await request.text();

    if (!webhookSecret || webhookSecret.startsWith('whsec_placeholder') || process.env.MOCK_STRIPE === 'true') {
      let mockEvent: { type: string; data?: { object?: { metadata?: { userId?: string; tier?: 'GOLD' | 'PLATINUM' } } } } =
        { type: 'mock.event' };
      try {
        mockEvent = JSON.parse(payload);
      } catch {
        // ignore
      }

      if (mockEvent.type === 'checkout.session.completed') {
        const userId = mockEvent.data?.object?.metadata?.userId;
        const tier = mockEvent.data?.object?.metadata?.tier;
        if (userId && tier) await mockUpgrade(userId, tier);
      }

      return apiSuccess({ received: true, mock: true, type: mockEvent.type });
    }

    if (!signature) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Missing stripe-signature header', 400);
    }

    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { userId?: string; tier?: string } };
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;
      if (userId && (tier === 'GOLD' || tier === 'PLATINUM')) {
        await mockUpgrade(userId, tier);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as { metadata?: { userId?: string } };
      if (sub.metadata?.userId) {
        await db.subscription.updateMany({
          where: { userId: sub.metadata.userId },
          data: { tier: 'FREE', status: 'CANCELLED' },
        });
      }
    }

    return apiSuccess({ received: true, type: event.type });
  } catch (error) {
    return handleApiError(error);
  }
}
