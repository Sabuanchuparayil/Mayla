import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { PRODUCTS, getPriceId, type ProductKey } from '@/lib/products';

export const dynamic = 'force-dynamic';

const schema = z.object({
  product: z.enum([
    'premium_monthly', 'premium_annual',
    'boost', 'superlike_5', 'superlike_15', 'superlike_30',
  ]),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { product: productKey, successUrl, cancelUrl } = parsed.data;
  const product = PRODUCTS[productKey as ProductKey];

  let priceId: string;
  try {
    priceId = getPriceId(productKey as ProductKey);
  } catch {
    return NextResponse.json({ error: 'Product not configured' }, { status: 503 });
  }

  // Get or create Stripe customer (customerId stored on most-recent Subscription row)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existingSub = await db.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: 'desc' },
  });

  let customerId = existingSub?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
      ...(user.email ? { email: user.email } : {}),
      ...(user.phone ? { phone: user.phone } : {}),
    });
    customerId = customer.id;
  }

  const mode = product.type === 'subscription' ? 'subscription' : 'payment';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? `${APP_URL}/settings/subscription?success=1`,
    cancel_url: cancelUrl ?? `${APP_URL}/settings/subscription?canceled=1`,
    metadata: {
      userId,
      productKey,
      creditKey: product.creditKey ?? '',
      creditAmount: String(product.creditAmount ?? 0),
    },
    ...(mode === 'subscription' && {
      subscription_data: {
        metadata: { userId, productKey },
      },
    }),
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
