'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SubscriptionData } from './page';

interface Props {
  initialData: SubscriptionData;
}

const PRODUCT_LABELS: Record<string, string> = {
  premium_monthly: 'Mayla Gold (Monthly)',
  premium_annual: 'Mayla Gold (Annual)',
  boost: 'Profile Boost',
  superlike_5: '5 Super Likes',
  superlike_15: '15 Super Likes',
  superlike_30: '30 Super Likes',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

// ---------- Toast ----------
function Toast({ message, color, onDismiss }: { message: string; color: 'green' | 'gray'; onDismiss: () => void }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
        color === 'green' ? 'bg-green-500' : 'bg-gray-500'
      }`}
    >
      {message}
      <button onClick={onDismiss} className="ml-3 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ---------- Skeleton ----------
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className ?? ''}`} />;
}

// ---------- Spinner ----------
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ---------- Crown icon ----------
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 19h20v2H2v-2zm2-4l3-8 5 5 5-7 3 10H4z" />
    </svg>
  );
}

export default function SubscriptionPage({ initialData }: Props) {
  const [data, setData] = useState<SubscriptionData>(initialData);
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [toast, setToast] = useState<{ message: string; color: 'green' | 'gray' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();

  // Show success/cancel toast from URL params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === '1') {
      showToast('Payment successful! Enjoy your plan.', 'green');
    } else if (canceled === '1') {
      showToast('Checkout was canceled.', 'gray');
    }
  }, [searchParams]);

  function showToast(message: string, color: 'green' | 'gray') {
    setToast({ message, color });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  async function handleCheckout(product: string) {
    setLoadingProduct(product);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });
      const json = (await res.json()) as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch {
      setLoadingProduct(null);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/payments/portal', { method: 'POST' });
      const json = (await res.json()) as { url?: string };
      if (json.url) window.location.href = json.url;
    } catch {
      setLoadingPortal(false);
    }
  }

  const { plan, subscription, purchases } = data;
  const isPremium = plan === 'GOLD' || plan === 'PLATINUM';
  const isActive = subscription?.status === 'ACTIVE';
  const isPendingCancel = !!subscription?.cancelledAt && isActive;

  const features = [
    'Unlimited likes',
    'See who liked you',
    'Super Likes',
    'Profile Boost',
    'Advanced filters',
  ];

  const recentPurchases = purchases.slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast message={toast.message} color={toast.color} onDismiss={() => setToast(null)} />
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>

        {/* ── Current Plan Banner ── */}
        {!isPremium ? (
          <div className="rounded-2xl shadow-sm p-6 bg-gradient-to-br from-pink-100 to-violet-100">
            <div className="flex items-center gap-3 mb-3">
              <CrownIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="font-semibold text-gray-800 text-lg">You&apos;re on the free plan</p>
                <p className="text-sm text-gray-500">Upgrade to unlock all features</p>
              </div>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('upgrade-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mt-2 bg-[#E85D75] text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Upgrade to Gold
            </button>
          </div>
        ) : (
          <div className="rounded-2xl shadow-sm p-6 bg-gradient-to-br from-amber-400 to-orange-400 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CrownIcon className="w-8 h-8 text-white" />
                <div>
                  <p className="font-bold text-xl">Mayla Gold</p>
                  {subscription?.currentPeriodEnd && (
                    <p className="text-sm text-amber-100">
                      Renews {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              </div>
              {/* Status pill */}
              {subscription?.status && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    subscription.status === 'ACTIVE'
                      ? 'bg-green-500 text-white'
                      : subscription.status === 'PAST_DUE'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}
                >
                  {subscription.status === 'PAST_DUE' ? 'PAST DUE' : subscription.status}
                </span>
              )}
            </div>

            {isPendingCancel && subscription?.cancelledAt && (
              <div className="mt-3 bg-amber-500/40 rounded-xl px-4 py-2 text-sm text-amber-100">
                ⚠ Cancels on {formatDate(subscription.cancelledAt)} — you keep access until then
              </div>
            )}

            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="mt-4 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {loadingPortal && <Spinner />}
              Manage subscription
            </button>
          </div>
        )}

        {/* ── Upgrade options (only if not subscribed) ── */}
        {!isPremium && (
          <section id="upgrade-section" className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Upgrade to Gold</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">Monthly</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">$19.99<span className="text-base font-normal text-gray-400">/mo</span></p>
                  <ul className="mt-4 space-y-1.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout('premium_monthly')}
                  disabled={loadingProduct === 'premium_monthly'}
                  className="mt-5 flex items-center justify-center gap-2 w-full bg-[#E85D75] text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingProduct === 'premium_monthly' && <Spinner />}
                  Get Gold
                </button>
              </div>

              {/* Annual */}
              <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-5 flex flex-col relative">
                <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SAVE 40%</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-base">Annual</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">$143.99<span className="text-base font-normal text-gray-400">/yr</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">Just $11.99/mo</p>
                  <ul className="mt-4 space-y-1.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleCheckout('premium_annual')}
                  disabled={loadingProduct === 'premium_annual'}
                  className="mt-5 flex items-center justify-center gap-2 w-full bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingProduct === 'premium_annual' && <Spinner />}
                  Get Gold Annual
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── One-time purchases ── */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">One-time purchases</h2>

          {/* Boost */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Profile Boost</p>
                <p className="text-xs text-gray-500">10× visibility for 30 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">$2.99</span>
              <button
                onClick={() => handleCheckout('boost')}
                disabled={loadingProduct === 'boost'}
                className="flex items-center gap-1.5 bg-[#E85D75] text-white font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loadingProduct === 'boost' ? <Spinner /> : 'Buy'}
              </button>
            </div>
          </div>

          {/* Super Like packs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { product: 'superlike_5', count: 5, price: '$4.99', badge: null },
                { product: 'superlike_15', count: 15, price: '$9.99', badge: 'Best value' },
                { product: 'superlike_30', count: 30, price: '$17.99', badge: null },
              ] as const
            ).map(({ product, count, price, badge }) => (
              <div
                key={product}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center text-center relative hover:shadow-md transition-shadow"
              >
                {badge && (
                  <span className="absolute top-2 right-2 bg-[#6C63FF] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
                <span className="text-2xl mb-1">⭐</span>
                <p className="font-bold text-gray-900 text-sm">{count} Super Likes</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{price}</p>
                <button
                  onClick={() => handleCheckout(product)}
                  disabled={loadingProduct === product}
                  className="mt-3 flex items-center gap-1.5 w-full justify-center bg-[#E85D75] text-white font-semibold py-2 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loadingProduct === product ? <Spinner /> : 'Buy'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Purchase history ── */}
        <section className="space-y-3 pb-6">
          <h2 className="text-lg font-bold text-gray-900">Purchase history</h2>
          {recentPurchases.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No purchases yet
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {recentPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {PRODUCT_LABELS[p.productId] ?? p.productId}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(p.amount, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
