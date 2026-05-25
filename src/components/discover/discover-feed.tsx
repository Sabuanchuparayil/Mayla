'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type Profile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  verified: boolean;
  photos: string[];
  interests: string[];
  distanceMeters: number | null;
  age: number | null;
};

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function DiscoverFeed() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matched, setMatched] = useState(false);
  const [swipeLimit, setSwipeLimit] = useState<number | null>(null);
  const [swipesUsed, setSwipesUsed] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<'left' | 'right' | null>(null);

  const loadFeed = useCallback(async (coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError('');
    const qs = coords ? `?latitude=${coords.lat}&longitude=${coords.lng}` : '';
    const result = await apiFetch<{
      profiles: Profile[];
      swipeLimit: number | null;
      swipesUsedToday: number;
    }>(`/api/discover${qs}`);
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setProfiles(result.data.profiles);
    setSwipeLimit(result.data.swipeLimit);
    setSwipesUsed(result.data.swipesUsedToday);
    setIndex(0);
    setMatched(false);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadFeed({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => loadFeed(),
      );
    } else {
      loadFeed();
    }
  }, [loadFeed]);

  const current = profiles[index];

  async function swipe(action: 'LIKE' | 'PASS') {
    if (!current) return;
    setError('');
    setSwipeAnim(action === 'LIKE' ? 'right' : 'left');

    const result = await apiFetch<{ matched: boolean; matchId?: string }>('/api/discover/swipe', {
      method: 'POST',
      body: JSON.stringify({ targetUserId: current.userId, action }),
    });

    setTimeout(() => {
      setSwipeAnim(null);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      if (result.data.matched) setMatched(true);
      setSwipesUsed((n) => n + 1);
      setIndex((i) => i + 1);
    }, 300);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Finding people near you...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      {swipeLimit !== null ? (
        <div className="flex items-center justify-center gap-3">
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
      ) : null}

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 border border-red-200/50">
          {error}
        </div>
      ) : null}

      {/* Match celebration */}
      {matched ? (
        <div className="animate-scale-in rounded-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-accent-50 p-6 text-center dark:from-primary-900/30 dark:to-accent-900/30 border border-primary/10">
          <div className="animate-heartbeat mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <HeartIcon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-primary">
            It&apos;s a match!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to Chat to say hello
          </p>
          <Button href="/chat" size="sm" className="mt-4">
            Open chat
          </Button>
        </div>
      ) : null}

      {/* Profile card */}
      {!current ? (
        <Card className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm-200/50 dark:bg-warm-400/10">
            <HeartIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground/70">
            No more profiles nearby
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Check back later for new faces</p>
          <Button className="mt-5" variant="outline" onClick={() => loadFeed()}>
            Refresh
          </Button>
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
        >
          {/* Photo area */}
          <div className="relative h-80 overflow-hidden">
            {current.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.photos[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-accent-100 dark:from-primary-900 dark:via-primary-950 dark:to-accent-900">
                <span className="font-[family-name:var(--font-playfair)] text-7xl font-semibold text-primary/40">
                  {current.displayName[0]}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 pt-16">
              <div className="flex items-end gap-2">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white">
                  {current.displayName}
                  {current.age ? <span className="ml-1 text-white/80">, {current.age}</span> : ''}
                </h2>
                {current.verified ? (
                  <span className="mb-0.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    Verified
                  </span>
                ) : null}
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

          {/* Bio + interests */}
          <div className="space-y-3 p-6">
            {current.bio ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{current.bio}</p>
            ) : null}

            {current.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {current.interests.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-primary/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => swipe('PASS')}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border border-warm-300 text-muted-foreground transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-warm-400/20 dark:hover:border-red-800 dark:hover:bg-red-950/30"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">Pass</span>
              </button>
              <button
                type="button"
                onClick={() => swipe('LIKE')}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/35 hover:brightness-105"
              >
                <HeartIcon className="h-5 w-5" />
                <span className="font-medium">Like</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
