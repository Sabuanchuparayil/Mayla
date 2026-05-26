'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CompatibilityBreakdown } from '@/lib/compatibility';
import { apiFetch } from '@/lib/api/client';

type Profile = {
  displayName: string;
  relationshipGoalLabel: string;
  relationshipGoalIcon: string;
};

type MatchCelebrationProps = {
  profile: Profile;
  compatibilityScore: number;
  matchReasons: string[];
  scoreBreakdown?: CompatibilityBreakdown;
  onDismiss: () => void;
};

const BREAKDOWN_LABELS: { key: keyof CompatibilityBreakdown; label: string; max: number }[] = [
  { key: 'preferenceMatch', label: 'Preferences', max: 25 },
  { key: 'interestOverlap', label: 'Interests', max: 20 },
  { key: 'languageOverlap', label: 'Languages', max: 15 },
  { key: 'goalAlignment', label: 'Relationship goal', max: 15 },
  { key: 'proximity', label: 'Proximity', max: 10 },
  { key: 'completeness', label: 'Profile quality', max: 10 },
  { key: 'activityRecency', label: 'Activity', max: 5 },
];

export function MatchCelebration({
  profile,
  compatibilityScore,
  matchReasons,
  scoreBreakdown,
  onDismiss,
}: MatchCelebrationProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ inviteLink: string }>('/api/referral/share-link').then((r) => {
      if (r.success) setShareLink(r.data.inviteLink);
    });
  }, []);

  return (
    <div className="animate-scale-in rounded-2xl border border-primary/10 bg-gradient-to-r from-primary-50 via-primary-100 to-accent-50 p-6 text-center dark:from-primary-900/30 dark:to-accent-900/30">
      <div className="animate-heartbeat mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-primary">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-primary">
        It&apos;s a match with {profile.displayName}!
      </h3>
      <p className="mt-2 text-2xl font-bold text-primary">{compatibilityScore}% compatible</p>
      {profile.relationshipGoalLabel ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.relationshipGoalIcon} Both on Mayla for {profile.relationshipGoalLabel}
        </p>
      ) : null}
      {scoreBreakdown ? (
        <div className="mt-4 space-y-2 text-left">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Compatibility breakdown
          </p>
          {BREAKDOWN_LABELS.map(({ key, label, max }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-warm-200/60 dark:bg-warm-400/10">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (scoreBreakdown[key] / max) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium">{scoreBreakdown[key]}</span>
            </div>
          ))}
        </div>
      ) : null}
      {matchReasons.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {matchReasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-emerald-200/50 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="flex justify-center gap-3">
          <Button href="/chat" size="sm">
            Say hello
          </Button>
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Keep swiping
          </Button>
        </div>
        <p className="max-w-sm text-center text-xs text-muted-foreground">
          Know someone who&apos;d love Mayla?{' '}
          <a href="/settings#invite" className="font-medium text-primary underline-offset-2 hover:underline">
            Share your invite link
          </a>
          {shareLink ? (
            <>
              {' '}
              or{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => void navigator.clipboard.writeText(shareLink)}
              >
                copy link
              </button>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
