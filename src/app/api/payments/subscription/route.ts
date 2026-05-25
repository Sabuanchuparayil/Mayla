import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/payments/subscription — current user's plan + subscription details
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [subscription, purchases] = await Promise.all([
    db.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    }),
    db.purchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        productId: true,
        productType: true,
        amount: true,
        currency: true,
        createdAt: true,
      },
    }),
  ]);

  const plan = subscription?.plan ?? 'BASIC';

  return NextResponse.json({
    plan,
    subscription: subscription ?? null,
    purchases,
  });
}
