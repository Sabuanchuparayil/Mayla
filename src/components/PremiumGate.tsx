'use client';

import { useState } from 'react';
import { usePremium, type Plan } from '@/hooks/usePremium';
import { getMonthlyPriceLabel, MONTHLY_PRODUCT_FOR_PLAN } from '@/lib/products';

interface PremiumGateProps {
  /** Minimum plan required */
  requires: Plan;
  /** Render prop — receives whether user has access */
  children: (hasAccess: boolean) => React.ReactNode;
  /** Feature name shown in the upgrade prompt */
  featureName?: string;
}

const PLAN_LABELS: Record<Plan, string> = {
  BASIC: 'Free',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
};

const PLAN_RANK: Record<Plan, number> = { BASIC: 0, GOLD: 1, PLATINUM: 2 };

export default function PremiumGate({ requires, children, featureName }: PremiumGateProps) {
  const { plan, isLoading } = usePremium();
  const [showModal, setShowModal] = useState(false);

  const hasAccess = !isLoading && PLAN_RANK[plan] >= PLAN_RANK[requires];

  if (isLoading) return <>{children(false)}</>;

  return (
    <>
      {children(hasAccess)}

      {!hasAccess && showModal && (
        <UpgradeModal
          requires={requires}
          featureName={featureName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// Convenience wrapper that shows the prompt on click when locked
export function PremiumButton({
  requires,
  featureName,
  onClick,
  children,
  className = '',
}: {
  requires: Plan;
  featureName?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { plan, isLoading } = usePremium();
  const [showModal, setShowModal] = useState(false);

  const hasAccess = !isLoading && PLAN_RANK[plan] >= PLAN_RANK[requires];

  const handleClick = () => {
    if (hasAccess) {
      onClick?.();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {children}
        {!hasAccess && !isLoading && (
          <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
            {PLAN_LABELS[requires]}
          </span>
        )}
      </button>

      {showModal && (
        <UpgradeModal
          requires={requires}
          featureName={featureName}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function UpgradeModal({
  requires,
  featureName,
  onClose,
}: {
  requires: Plan;
  featureName?: string;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Modal only ever gates paid plans; fall back to Gold for the BASIC edge case.
  const targetPlan = requires === 'PLATINUM' ? 'PLATINUM' : 'GOLD';
  const checkoutProduct = MONTHLY_PRODUCT_FOR_PLAN[targetPlan];
  const priceLabel = getMonthlyPriceLabel(targetPlan);

  const upgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: checkoutProduct }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setIsLoading(false);
    }
  };

  const FEATURES: Record<Plan, string[]> = {
    BASIC: [],
    GOLD: ['Unlimited likes', 'See who liked you', 'Super Likes', 'Profile Boost', 'Advanced filters'],
    PLATINUM: ['Everything in Gold', 'Priority in discovery', 'Read receipts', 'Incognito mode'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
        {/* Crown icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.5 17L4 7l4.5 4.5L12 4l3.5 7.5L20 7l1.5 10h-19z" />
            </svg>
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900">
          Upgrade to {PLAN_LABELS[targetPlan]}
        </h2>
        {featureName && (
          <p className="mt-1 text-center text-sm text-gray-500">
            {featureName} requires a {PLAN_LABELS[targetPlan]} subscription
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {FEATURES[targetPlan].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 shrink-0 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={upgrade}
          disabled={isLoading}
          className="mt-6 w-full rounded-xl bg-primary-500 py-3.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Loading…' : `Get ${PLAN_LABELS[targetPlan]} — ${priceLabel}/mo`}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl py-2.5 text-sm text-gray-500 hover:text-gray-700"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
