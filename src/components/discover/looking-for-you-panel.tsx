'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type Entry = {
  userId: string;
  displayName: string;
  relationshipGoalLabel: string;
  city: string | null;
};

export function LookingForYouPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ entries: Entry[]; enabled: boolean; total: number }>('/api/discover/looking-for-you').then(
      (r) => {
        setLoading(false);
        if (r.success) {
          setEntries(r.data.entries);
          setEnabled(r.data.enabled);
        }
      },
    );
  }, []);

  async function likeBack(userId: string) {
    const result = await apiFetch<{ matchId: string }>('/api/discover/likes-you', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.userId !== userId));
      window.location.href = '/chat';
    }
  }

  if (loading) return <div className="h-20 animate-pulse rounded-xl bg-warm-200/50" />;
  if (!enabled) {
    return (
      <Card className="p-4">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">Looking for You</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Platinum members see people who liked you and share your relationship goal.
        </p>
        <Button href="/settings" size="sm" variant="outline" className="mt-3">
          Upgrade to Platinum
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">
          Looking for You {entries.length > 0 ? `(${entries.length})` : ''}
        </h2>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        People who liked you and want the same thing you do
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goal-aligned likes yet — check back soon.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className="flex items-center gap-3 rounded-xl border border-emerald-200/40 bg-emerald-50/30 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40">
                {entry.displayName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{entry.displayName}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {entry.relationshipGoalLabel}
                  {entry.city ? ` · ${entry.city}` : ''}
                </p>
              </div>
              <Button size="sm" onClick={() => void likeBack(entry.userId)}>
                Match
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
