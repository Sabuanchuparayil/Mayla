// Product catalog — price IDs come from env, keeping code decoupled from Stripe dashboard
export type ProductKey =
  | 'premium_monthly'
  | 'premium_annual'
  | 'platinum_monthly'
  | 'platinum_annual'
  | 'boost'
  | 'superlike_5'
  | 'superlike_15'
  | 'superlike_30';

export type ProductType = 'subscription' | 'one_time';

export interface Product {
  key: ProductKey;
  name: string;
  description: string;
  type: ProductType;
  plan?: 'GOLD' | 'PLATINUM';
  priceEnv: string;        // env var holding the Stripe Price ID
  creditKey?: string;      // what to credit on purchase
  creditAmount?: number;
  amount?: number;         // fallback cents (for display only)
  currency: string;
}

export const PRODUCTS: Record<ProductKey, Product> = {
  premium_monthly: {
    key: 'premium_monthly',
    name: 'Mayla Gold',
    description: 'Unlimited likes, see who liked you, advanced filters',
    type: 'subscription',
    plan: 'GOLD',
    priceEnv: 'STRIPE_PRICE_GOLD_MONTHLY',
    amount: 1999,
    currency: 'usd',
  },
  premium_annual: {
    key: 'premium_annual',
    name: 'Mayla Gold Annual',
    description: 'Everything in Gold, billed annually (save 40%)',
    type: 'subscription',
    plan: 'GOLD',
    priceEnv: 'STRIPE_PRICE_GOLD_ANNUAL',
    amount: 14399,
    currency: 'usd',
  },
  platinum_monthly: {
    key: 'platinum_monthly',
    name: 'Mayla Platinum',
    description: 'Everything in Gold, plus priority discovery, read receipts, and incognito mode',
    type: 'subscription',
    plan: 'PLATINUM',
    priceEnv: 'STRIPE_PRICE_PLATINUM_MONTHLY',
    amount: 2999,
    currency: 'usd',
  },
  platinum_annual: {
    key: 'platinum_annual',
    name: 'Mayla Platinum Annual',
    description: 'Everything in Platinum, billed annually (save 40%)',
    type: 'subscription',
    plan: 'PLATINUM',
    priceEnv: 'STRIPE_PRICE_PLATINUM_ANNUAL',
    amount: 21599,
    currency: 'usd',
  },
  boost: {
    key: 'boost',
    name: 'Profile Boost',
    description: 'Be seen by 10× more people for 30 minutes',
    type: 'one_time',
    priceEnv: 'STRIPE_PRICE_BOOST',
    creditKey: 'boosts',
    creditAmount: 1,
    amount: 299,
    currency: 'usd',
  },
  superlike_5: {
    key: 'superlike_5',
    name: '5 Super Likes',
    description: 'Stand out from the crowd',
    type: 'one_time',
    priceEnv: 'STRIPE_PRICE_SUPERLIKE_5',
    creditKey: 'superlikes',
    creditAmount: 5,
    amount: 499,
    currency: 'usd',
  },
  superlike_15: {
    key: 'superlike_15',
    name: '15 Super Likes',
    description: 'Best value super like pack',
    type: 'one_time',
    priceEnv: 'STRIPE_PRICE_SUPERLIKE_15',
    creditKey: 'superlikes',
    creditAmount: 15,
    amount: 999,
    currency: 'usd',
  },
  superlike_30: {
    key: 'superlike_30',
    name: '30 Super Likes',
    description: 'Super like everyone you want',
    type: 'one_time',
    priceEnv: 'STRIPE_PRICE_SUPERLIKE_30',
    creditKey: 'superlikes',
    creditAmount: 30,
    amount: 1799,
    currency: 'usd',
  },
};

export function getPriceId(key: ProductKey): string {
  const product = PRODUCTS[key];
  const priceId = process.env[product.priceEnv];
  if (!priceId) throw new Error(`Missing env var ${product.priceEnv}`);
  return priceId;
}

export type SubscriptionPlan = 'GOLD' | 'PLATINUM';

// The monthly checkout product to use when upgrading to a given plan
export const MONTHLY_PRODUCT_FOR_PLAN: Record<SubscriptionPlan, ProductKey> = {
  GOLD: 'premium_monthly',
  PLATINUM: 'platinum_monthly',
};

// Display-only formatted monthly price for a plan, e.g. "$19.99"
export function getMonthlyPriceLabel(plan: SubscriptionPlan): string {
  const product = PRODUCTS[MONTHLY_PRODUCT_FOR_PLAN[plan]];
  const amount = (product.amount ?? 0) / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency.toUpperCase(),
  }).format(amount);
  return formatted;
}
