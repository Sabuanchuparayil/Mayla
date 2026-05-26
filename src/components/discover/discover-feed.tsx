'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipSelect } from '@/components/ui/chip-select';
import { DiscoverCardSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api/client';
import { RELATIONSHIP_GOALS } from '@/lib/constants/profile-options';
import { MatchCelebration } from '@/components/discover/match-celebration';
import { BlockReportModal } from '@/components/safety/block-report-modal';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { useLocale } from '@/hooks/use-locale';
import { useSwipeGesture } from '@/hooks/use-swipe-gesture';
import { ProfilePhotoGallery } from '@/components/profile/profile-photo-gallery';

type Profile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  verified: boolean;
  photos: string[];
  interests: string[];
  lifestyle: string[];
  languages: string[];
  nationality: string | null;
  relationshipGoal: string | null;
  relationshipGoalLabel: string;
  relationshipGoalIcon: string;
  personalityPrompts: { prompt: string; answer: string }[];
  distanceMeters: number | null;
  age: number | null;
  compatibilityScore: number;
  matchReasons: string[];
  goalMatch: boolean;
  availabilityLabel: string | null;
  isAvailable: boolean;
  gentlemanStars: number;
  dreamDates: string[];
  blurredPhotoIndices: number[];
  scoreBreakdown?: import('@/lib/compatibility').CompatibilityBreakdown;
};

type MatchResult = {
  matched: boolean;
  matchId?: string;
  compatibilityScore?: number;
  matchReasons?: string[];
  scoreBreakdown?: import('@/lib/compatibility').CompatibilityBreakdown;
};

type GiftCatalogItem = {
  type: string;
  label: string;
  icon: string;
  tier: string;
};

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function DiscoverFeed() {
  const { t } = useLocale();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [swipeLimit, setSwipeLimit] = useState<number | null>(null);
  const [swipesUsed, setSwipesUsed] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<'left' | 'right' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [canFilterGoals, setCanFilterGoals] = useState(false);
  const [maxGoalFilters, setMaxGoalFilters] = useState(0);
  const [goalFilters, setGoalFilters] = useState<string[]>([]);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [canSeeAvailability, setCanSeeAvailability] = useState(false);
  const [canSendDateRequests, setCanSendDateRequests] = useState(false);
  const [canSendGifts, setCanSendGifts] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [dateRequestSent, setDateRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [giftCatalog, setGiftCatalog] = useState<GiftCatalogItem[]>([]);
  const [giftMessage, setGiftMessage] = useState('');
  const [sendingGift, setSendingGift] = useState(false);
  const [giftSent, setGiftSent] = useState(false);
  const [undoTarget, setUndoTarget] = useState<{ profile: Profile; expiresAt: number } | null>(null);
  const swipingRef = useRef(false);

  const loadFeed = useCallback(async (coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError('');
    const qs = coords ? `?latitude=${coords.lat}&longitude=${coords.lng}` : '';
    const result = await apiFetch<{
      profiles: Profile[];
      swipeLimit: number | null;
      swipesUsedToday: number;
      canSeeAvailability: boolean;
      canSendDateRequests: boolean;
      canSendGifts: boolean;
    }>(`/api/discover${qs}`);
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setProfiles(result.data.profiles);
    setSwipeLimit(result.data.swipeLimit);
    setSwipesUsed(result.data.swipesUsedToday);
    setCanSeeAvailability(result.data.canSeeAvailability);
    setCanSendDateRequests(result.data.canSendDateRequests);
    setCanSendGifts(result.data.canSendGifts);
    setIndex(0);
    setMatchResult(null);
    setDateRequestSent(false);
    setGiftSent(false);
    setUndoTarget(null);
  }, []);

  useEffect(() => {
    apiFetch<{ canFilterGoals: boolean; maxGoalFilters: number; preferences: { relationshipGoals: string[] } }>(
      '/api/users/me/preferences',
    ).then((r) => {
      if (r.success) {
        setCanFilterGoals(r.data.canFilterGoals);
        setMaxGoalFilters(r.data.maxGoalFilters);
        setGoalFilters(r.data.preferences.relationshipGoals);
      }
    });

    apiFetch<{ catalog: GiftCatalogItem[] }>('/api/gifts').then((r) => {
      if (r.success) setGiftCatalog(r.data.catalog);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadFeed({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => loadFeed(),
      );
    } else {
      loadFeed();
    }
  }, [loadFeed]);

  async function saveGoalFilters(goals: string[]) {
    if (!canFilterGoals) {
      setError('Upgrade to Gold to filter by relationship goal');
      return;
    }
    const result = await apiFetch('/api/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ relationshipGoals: goals }),
    });
    if (result.success) {
      setGoalFilters(goals);
      setShowFilters(false);
      loadFeed();
    } else if (!result.success) {
      setError(result.error.message);
    }
  }

  async function sendDateRequest() {
    if (!current || !canSendDateRequests) {
      setError('Upgrade to Gold to send Date Requests');
      return;
    }
    setSendingRequest(true);
    setError('');
    const result = await apiFetch('/api/date-requests', {
      method: 'POST',
      body: JSON.stringify({ toUserId: current.userId }),
    });
    setSendingRequest(false);
    if (result.success) {
      setDateRequestSent(true);
    } else {
      setError(result.error.message);
    }
  }

  async function sendGift(giftType: string) {
    if (!current || !canSendGifts) {
      setError('Upgrade to Gold to send gifts');
      return;
    }
    setSendingGift(true);
    setError('');
    const result = await apiFetch('/api/gifts', {
      method: 'POST',
      body: JSON.stringify({
        toUserId: current.userId,
        giftType,
        message: giftMessage.trim() || undefined,
      }),
    });
    setSendingGift(false);
    if (result.success) {
      setGiftSent(true);
      setShowGiftPicker(false);
      setGiftMessage('');
    } else {
      setError(result.error.message);
    }
  }

  const current = profiles[index];

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => {
      if (current && !swipingRef.current) void swipe('PASS');
    },
    onSwipeRight: () => {
      if (current && !swipingRef.current) void swipe('LIKE');
    },
  });

  useEffect(() => {
    if (!undoTarget) return;
    const remaining = undoTarget.expiresAt - Date.now();
    if (remaining <= 0) {
      setUndoTarget(null);
      return;
    }
    const timer = setTimeout(() => setUndoTarget(null), remaining);
    return () => clearTimeout(timer);
  }, [undoTarget]);

  async function undoSwipe() {
    if (!undoTarget) return;
    const result = await apiFetch('/api/discover/swipe', {
      method: 'DELETE',
      body: JSON.stringify({ targetUserId: undoTarget.profile.userId }),
    });
    if (result.success) {
      setIndex((i) => Math.max(0, i - 1));
      setSwipesUsed((n) => Math.max(0, n - 1));
      setUndoTarget(null);
      setMatchResult(null);
      setMatchedProfile(null);
    } else {
      setError(result.error.message);
      setUndoTarget(null);
    }
  }

  useEffect(() => {
    setDateRequestSent(false);
    setGiftSent(false);
  }, [current?.userId]);

  async function swipe(action: 'LIKE' | 'PASS') {
    if (!current || swipingRef.current) return;
    swipingRef.current = true;
    setError('');
    setSwipeAnim(action === 'LIKE' ? 'right' : 'left');
    const swipedProfile = current;

    const result = await apiFetch<MatchResult>('/api/discover/swipe', {
      method: 'POST',
      body: JSON.stringify({ targetUserId: current.userId, action }),
    });

    setTimeout(() => {
      setSwipeAnim(null);
      swipingRef.current = false;
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      if (result.data.matched) {
        setMatchResult(result.data);
        setMatchedProfile(swipedProfile);
        setUndoTarget(null);
      } else {
        setUndoTarget({ profile: swipedProfile, expiresAt: Date.now() + 60_000 });
      }
      setSwipesUsed((n) => n + 1);
      setIndex((i) => i + 1);
    }, 300);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <DiscoverCardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center justify-between">
        {swipeLimit !== null ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: swipeLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                    i < swipesUsed ? 'bg-primary/30' : 'bg-primary'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {swipesUsed}/{swipeLimit} today
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unlimited swipes</span>
        )}
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="rounded-lg border border-warm-300/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 dark:border-warm-400/20"
        >
          Filters {goalFilters.length > 0 ? `(${goalFilters.length})` : ''}
        </button>
      </div>

      {showFilters ? (
        <Card className="space-y-3 p-4">
          <p className="text-sm font-medium">Filter by relationship goal</p>
          {!canFilterGoals ? (
            <p className="text-xs text-muted-foreground">
              Upgrade to Gold to filter discover by goal. Everyone&apos;s goal is visible on their card.
            </p>
          ) : null}
          <ChipSelect
            options={RELATIONSHIP_GOALS.map((g) => ({ value: g.value, label: g.label }))}
            value={goalFilters}
            onChange={saveGoalFilters}
            max={canFilterGoals ? maxGoalFilters : 0}
          />
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200/50 bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50">
          {error}
        </div>
      ) : null}

      {matchResult?.matched && matchedProfile ? (
        <MatchCelebration
          profile={matchedProfile}
          compatibilityScore={matchResult.compatibilityScore ?? 0}
          matchReasons={matchResult.matchReasons ?? []}
          scoreBreakdown={matchResult.scoreBreakdown ?? matchedProfile.scoreBreakdown}
          onDismiss={() => {
            setMatchResult(null);
            setMatchedProfile(null);
          }}
        />
      ) : null}

      {undoTarget ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            Passed on {undoTarget.profile.displayName}
          </span>
          <Button size="sm" variant="outline" onClick={() => void undoSwipe()}>
            Undo
          </Button>
        </div>
      ) : null}

      {!current ? (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-200/50 dark:bg-warm-400/10">
            <HeartIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground/70">
            No more profiles nearby
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try widening your distance filters or check back later for new faces
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setShowFilters(true)}>
              Adjust filters
            </Button>
            <Button onClick={() => loadFeed()}>Refresh</Button>
          </div>
        </Card>
      ) : (
        <div
          className={`glass-card overflow-hidden p-0 transition-all duration-300 ${
            swipeAnim === 'left'
              ? '-translate-x-8 rotate-[-3deg] opacity-0'
              : swipeAnim === 'right'
                ? 'translate-x-8 rotate-[3deg] opacity-0'
                : 'animate-scale-in'
          }`}
          {...swipeGesture}
        >
          <div className="relative h-80 overflow-hidden">
            <ProfilePhotoGallery
              photos={current.photos}
              displayName={current.displayName}
              blurredPhotoIndices={current.blurredPhotoIndices}
              mainClassName="h-80"
            />
            <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-2">
              {current.relationshipGoal ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
                    current.goalMatch
                      ? 'bg-emerald-500/90 text-white'
                      : 'bg-black/40 text-white'
                  }`}
                >
                  {current.relationshipGoalIcon} {current.relationshipGoalLabel}
                </span>
              ) : null}
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {current.compatibilityScore}% match
              </span>
            </div>
            {canSeeAvailability && current.isAvailable && current.availabilityLabel ? (
              <span className="absolute right-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                🗓 {current.availabilityLabel}
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 pt-16">
              <div className="flex items-end justify-between gap-2">
                <div className="flex flex-wrap items-end gap-2">
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white">
                    {current.displayName}
                    {current.age ? <span className="ml-1 text-white/80">, {current.age}</span> : ''}
                  </h2>
                  {current.verified ? <VerifiedBadge size="md" /> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setShowBlockReport(true)}
                  aria-label={`More options for ${current.displayName}`}
                  className="mb-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50 active:scale-95"
                >
                  ···
                </button>
              </div>
              {current.city || current.distanceMeters != null ? (
                <p className="mt-1 text-sm text-white/70">
                  {current.city}
                  {current.distanceMeters != null
                    ? ` · ${Math.round(current.distanceMeters / 1000)} km`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 p-6">
            {current.gentlemanStars > 0 ? (
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {'★'.repeat(current.gentlemanStars)} Gentleman score
              </p>
            ) : null}
            {current.matchReasons.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {current.matchReasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full border border-emerald-200/50 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            ) : null}

            {current.personalityPrompts[0]?.answer ? (
              <div className="rounded-xl bg-warm-100/50 p-3 dark:bg-warm-400/5">
                <p className="text-xs font-medium text-primary">{current.personalityPrompts[0].prompt}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {current.personalityPrompts[0].answer}
                </p>
              </div>
            ) : current.bio ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{current.bio}</p>
            ) : null}

            {[...current.interests, ...current.lifestyle, ...current.dreamDates].length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {[...current.interests, ...current.lifestyle, ...current.dreamDates].slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-3">
              {canSendDateRequests && current.isAvailable ? (
                <Button
                  variant="outline"
                  className="w-full"
                  loading={sendingRequest}
                  disabled={dateRequestSent}
                  onClick={() => void sendDateRequest()}
                >
                  {dateRequestSent ? t('dateRequestSent') : t('sendDateRequest')}
                </Button>
              ) : null}
              {canSendGifts ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={giftSent}
                  onClick={() => setShowGiftPicker(true)}
                >
                  {giftSent ? t('giftSent') : t('sendGift')}
                </Button>
              ) : null}
              <div className="flex gap-3">
              <button
                type="button"
                onClick={() => swipe('PASS')}
                aria-label={`Pass on ${current.displayName}`}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-warm-300 text-muted-foreground transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500 active:scale-95 dark:border-warm-400/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">{t('pass')}</span>
              </button>
              <button
                type="button"
                onClick={() => swipe('LIKE')}
                aria-label={`Like ${current.displayName}`}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:brightness-105 active:scale-95"
              >
                <HeartIcon className="h-5 w-5" />
                <span className="font-medium">{t('like')}</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {current && showGiftPicker ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
          <Card className="w-full max-w-md space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Send a gift to {current.displayName}</h3>
              <button
                type="button"
                onClick={() => setShowGiftPicker(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {giftCatalog.map((gift) => (
                <button
                  key={gift.type}
                  type="button"
                  disabled={sendingGift}
                  onClick={() => void sendGift(gift.type)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-card-border p-4 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="text-2xl">{gift.icon}</span>
                  <span className="text-sm font-medium">{gift.label}</span>
                  <span className="text-xs text-muted-foreground">{gift.tier}+</span>
                </button>
              ))}
            </div>
            <textarea
              className="min-h-[60px] w-full rounded-xl border border-card-border bg-transparent p-3 text-sm"
              placeholder="Optional message..."
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
            />
          </Card>
        </div>
      ) : null}

      {current && showBlockReport ? (
        <BlockReportModal
          userId={current.userId}
          displayName={current.displayName}
          open={showBlockReport}
          onClose={() => setShowBlockReport(false)}
          onBlocked={() => {
            setShowBlockReport(false);
            setIndex((i) => i + 1);
          }}
        />
      ) : null}
    </div>
  );
}
