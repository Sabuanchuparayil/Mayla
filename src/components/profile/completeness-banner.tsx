'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export function ProfileCompletenessBanner() {
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [topHint, setTopHint] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/me/profile', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.completeness != null) {
          setCompleteness(data.data.completeness);
          setTopHint(data.data.hints?.[0] ?? null);
        }
      })
      .catch(() => undefined);
  }, []);

  if (completeness == null || completeness >= 85) return null;

  return (
    <Card className="border-primary/15 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Your profile is {completeness}% complete</p>
          {topHint ? (
            <p className="mt-1 text-xs text-muted-foreground">{topHint}</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Complete profiles get more visibility in Discover
            </p>
          )}
        </div>
        <Link
          href="/profile"
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90"
        >
          Complete profile
        </Link>
      </div>
    </Card>
  );
}
