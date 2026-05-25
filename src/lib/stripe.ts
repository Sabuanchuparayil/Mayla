import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock';
    client = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    });
  }
  return client;
}

/** @deprecated use getStripe() */
export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    const s = getStripe();
    const value = s[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(s) : value;
  },
});
