'use client';

import { useEffect, useState, useCallback } from 'react';

export type Plan = 'BASIC' | 'GOLD' | 'PLATINUM';

export interface PremiumState {
  plan: Plan;
  isLoading: boolean;
  isGold: boolean;
  isPlatinum: boolean;
  isPremium: boolean; // GOLD or PLATINUM
  canSuperLike: boolean;
  canBoost: boolean;
  canSeeWhoLikedYou: boolean;
  unlimitedLikes: boolean;
  refresh: () => void;
}

const PLAN_RANK: Record<Plan, number> = { BASIC: 0, GOLD: 1, PLATINUM: 2 };

export function usePremium(): PremiumState {
  const [plan, setPlan] = useState<Plan>('BASIC');
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(() => {
    setIsLoading(true);
    fetch('/api/payments/subscription')
      .then((r) => r.json())
      .then((data: { plan?: Plan }) => {
        if (data.plan) setPlan(data.plan);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const rank = PLAN_RANK[plan];
  const isGold = rank >= PLAN_RANK.GOLD;
  const isPlatinum = rank >= PLAN_RANK.PLATINUM;

  return {
    plan,
    isLoading,
    isGold,
    isPlatinum,
    isPremium: isGold || isPlatinum,
    canSuperLike: isGold,
    canBoost: isGold,
    canSeeWhoLikedYou: isGold,
    unlimitedLikes: isGold,
    refresh: fetch_,
  };
}
