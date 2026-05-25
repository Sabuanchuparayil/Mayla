'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

type NearbyProfile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  distanceMeters: number;
};

export function NearbyList() {
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const result = await apiFetch<{ profiles: NearbyProfile[] }>(
        `/api/nearby?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&radiusMeters=50000`,
      );
      setLoading(false);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      setProfiles(result.data.profiles);
    }, () => {
      setLoading(false);
      setError('Location permission denied. Enable it to discover people nearby.');
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Finding people near you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </Card>
    );
  }

  if (profiles.length === 0) {
    return (
      <Card className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warm-200/50 dark:bg-warm-400/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-muted-foreground/40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>
        <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground/70">
          No one nearby yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Check back later as new people join</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {profiles.map((p, i) => (
        <li key={p.userId} className={`animate-fade-up`} style={{ animationDelay: `${i * 80}ms` }}>
          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40">
              <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-primary">
                {p.displayName[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{p.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(p.distanceMeters / 1000)} km away
                {p.city ? ` · ${p.city}` : ''}
              </p>
              {p.bio ? <p className="mt-0.5 truncate text-xs text-muted-foreground/60">{p.bio}</p> : null}
            </div>
            <Button href="/discover" variant="outline" size="sm">
              View
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
