import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// POST /api/payments/portal — redirect to Stripe Customer Portal for management/cancellation
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await db.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/settings/subscription`,
  });

  return NextResponse.json({ url: session.url });
}
