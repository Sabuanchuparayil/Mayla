import { cookies } from 'next/headers';
import SubscriptionPage from './SubscriptionPage';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
}

interface Purchase {
  id: string;
  productId: string;
  productType: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface SubscriptionData {
  plan: 'BASIC' | 'GOLD' | 'PLATINUM';
  subscription: Subscription | null;
  purchases: Purchase[];
}

export default async function SubscriptionSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  let data: SubscriptionData = { plan: 'BASIC', subscription: null, purchases: [] };

  try {
    const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/payments/subscription`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      data = (await res.json()) as SubscriptionData;
    }
  } catch {
    // use defaults
  }

  return <SubscriptionPage initialData={data} />;
}
