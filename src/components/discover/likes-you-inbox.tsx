'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type LikeEntry = {
  userId: string;
  displayName: string;
  photos: string[];
  blurred: boolean;
  canLikeBack: boolean;
  likedAt: string;
  compatibilityHint: string | null;
};

export function LikesYouInbox() {
  const [likes, setLikes] = useState<LikeEntry[]>([]);
  const [canRevealAll, setCanRevealAll] = useState(false);
  const [referralReveal, setReferralReveal] = useState(false);
  const [inviteToReveal, setInviteToReveal] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ likes: LikeEntry[]; canReveal: boolean; referralReveal: boolean; total: number; inviteToReveal?: boolean }>(
      '/api/discover/likes-you',
    ).then(
      (r) => {
        setLoading(false);
        if (r.success) {
          setLikes(r.data.likes);
          setCanRevealAll(r.data.canReveal);
          setReferralReveal(r.data.referralReveal);
          setInviteToReveal(Boolean(r.data.inviteToReveal));
          setTotal(r.data.total);
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
      setLikes((prev) => prev.filter((l) => l.userId !== userId));
      window.location.href = '/chat';
    }
  }

  if (loading) {
    return <div className="h-20 animate-pulse rounded-xl bg-warm-200/50" />;
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">
          Likes You {total > 0 ? `(${total})` : ''}
        </h2>
        {inviteToReveal ? (
          <Button href="/settings#invite" size="sm" variant="outline">
            Invite 1 friend to reveal
          </Button>
        ) : !canRevealAll && total > 0 ? (
          <Button href="/settings" size="sm" variant="outline">
            {referralReveal ? 'Upgrade to reveal all' : 'Upgrade to reveal'}
          </Button>
        ) : null}
      </div>

      {likes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new likes yet — keep swiping!</p>
      ) : (
        <ul className="space-y-3">
          {likes.map((like) => (
            <li
              key={like.userId}
              className="flex items-center gap-3 rounded-xl border border-card-border p-3"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary ${
                  like.blurred ? 'blur-sm' : ''
                }`}
              >
                {like.displayName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${like.blurred ? 'blur-[4px]' : ''}`}>{like.displayName}</p>
                {like.compatibilityHint ? (
                  <p className="text-xs text-muted-foreground">{like.compatibilityHint}</p>
                ) : null}
              </div>
              {like.canLikeBack ? (
                <Button size="sm" onClick={() => void likeBack(like.userId)}>
                  Like back
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
