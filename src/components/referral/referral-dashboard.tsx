'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

type ReferralStats = {
  code: string;
  inviteLink: string;
  whatsAppText: string;
  whatsAppUrl?: string;
  completed: number;
  pending: number;
  badges: string[];
  progressToNext: { current: number; target: number } | null;
  nextMilestone: { count: number; badge: string } | null;
  currentMilestone: { badge: string } | null;
};

export function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<ReferralStats>('/api/referral/code'),
      apiFetch<{ whatsAppUrl: string; inviteLink: string; whatsAppText: string; code: string }>(
        '/api/referral/share-link',
      ),
    ]).then(([codeRes, shareRes]) => {
      setLoading(false);
      if (codeRes.success) {
        setStats({
          ...codeRes.data,
          whatsAppUrl: shareRes.success ? shareRes.data.whatsAppUrl : undefined,
        });
      }
    });
  }, []);

  async function copyLink() {
    if (!stats) return;
    await navigator.clipboard.writeText(stats.inviteLink);
    setMessage('Invite link copied');
    setTimeout(() => setMessage(''), 2500);
  }

  async function copyCode() {
    if (!stats) return;
    await navigator.clipboard.writeText(stats.code);
    setMessage('Invite code copied');
    setTimeout(() => setMessage(''), 2500);
  }

  async function nativeShare() {
    if (!stats) return;
    if (navigator.share) {
      await navigator.share({
        title: 'Join me on Mayla',
        text: stats.whatsAppText,
        url: stats.inviteLink,
      });
      return;
    }
    await copyLink();
  }

  async function saveCustomCode() {
    const result = await apiFetch<ReferralStats>('/api/referral/code', {
      method: 'PATCH',
      body: JSON.stringify({ code: customCode }),
    });
    if (result.success) {
      setStats((prev) => (prev ? { ...prev, ...result.data } : result.data));
      setMessage('Your personal invite code is set');
      setCustomCode('');
      setTimeout(() => setMessage(''), 2500);
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-warm-200/50 dark:bg-warm-400/10" />;
  }

  if (!stats) return null;

  const progress = stats.progressToNext
    ? Math.min(100, (stats.progressToNext.current / stats.progressToNext.target) * 100)
    : 100;

  return (
    <div id="invite">
    <Card>
      <CardHeader
        title="Invite friends"
        description="Share your code at brunch, the salon, or in your group chat — both of you get premium perks."
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your invite code</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primary">{stats.code}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void copyCode()}>
              Copy code
            </Button>
            <Button size="sm" variant="outline" onClick={() => void copyLink()}>
              Copy link
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (stats.whatsAppUrl) window.open(stats.whatsAppUrl, '_blank');
              }}
            >
              WhatsApp
            </Button>
            <Button size="sm" onClick={() => void nativeShare()}>
              Share
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{stats.completed} friends joined</span>
            {stats.nextMilestone ? (
              <span>
                {stats.progressToNext?.current ?? 0}/{stats.nextMilestone.count} to {stats.nextMilestone.badge}
              </span>
            ) : (
              <span>Max tier unlocked</span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-warm-200/60 dark:bg-warm-400/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {stats.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-amber-200/60 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="rounded-xl border border-card-border p-3">
          <Label htmlFor="customCode">Customize your code (once)</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id="customCode"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="SARADXB"
              maxLength={16}
            />
            <Button variant="outline" onClick={() => void saveCustomCode()} disabled={customCode.length < 4}>
              Save
            </Button>
          </div>
        </div>

        <ul className="list-inside list-disc text-xs text-muted-foreground">
          <li>1 friend → 3 days Gold + Connector badge</li>
          <li>3 friends → 7 days Gold + Social Butterfly</li>
          <li>5 friends → 14 days Platinum + Inner Circle</li>
          <li>10 friends → 30 days Platinum + Mayla Ambassador</li>
        </ul>
      </div>

      {message ? <p className="mt-3 text-sm font-medium text-emerald-600">{message}</p> : null}
    </Card>
    </div>
  );
}
