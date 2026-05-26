'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

export function GentlemanScoreCard() {
  const [data, setData] = useState<{
    score: number;
    stars: number;
    label: string;
    tips: string[];
  } | null>(null);

  useEffect(() => {
    apiFetch<{ score: number; stars: number; label: string; tips: string[] }>(
      '/api/users/me/gentleman-score',
    ).then((r) => {
      if (r.success) setData(r.data);
    });
  }, []);

  if (!data) return null;

  return (
    <Card className="animate-fade-up delay-200">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/30">
          <span className="text-lg text-indigo-600 dark:text-indigo-400">
            {'★'.repeat(data.stars) || '☆'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{data.label}</p>
          <p className="text-lg font-semibold">{data.score}/100</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {data.tips.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
