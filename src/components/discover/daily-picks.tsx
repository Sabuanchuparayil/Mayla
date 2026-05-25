'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type Pick = {
  userId: string;
  displayName: string;
  compatibilityScore: number;
  matchReasons: string[];
  relationshipGoalLabel: string;
};

export function DailyPicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ picks: Pick[] }>('/api/discover/daily-picks').then((r) => {
      setLoading(false);
      if (r.success) setPicks(r.data.picks);
    });
  }, []);

  if (loading) return null;
  if (picks.length === 0) return null;

  return (
    <Card className="p-4">
      <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-lg font-semibold">
        Today&apos;s Top Picks
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {picks.map((p) => (
          <div
            key={p.userId}
            className="min-w-[140px] rounded-xl border border-primary/10 bg-primary/5 p-3"
          >
            <p className="font-medium">{p.displayName}</p>
            <p className="text-xs text-primary">{p.compatibilityScore}% match</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.relationshipGoalLabel}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
