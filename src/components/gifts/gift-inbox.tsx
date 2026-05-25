'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type Gift = {
  id: string;
  giftType: string;
  message: string | null;
  fromUser: { profile: { displayName: string } | null };
};

const GIFT_ICONS: Record<string, string> = {
  ROSE: '🌹',
  COFFEE: '☕',
  DINNER_INVITE: '🍽️',
  WEEKEND_PACKAGE: '✈️',
};

export function GiftInbox() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ gifts: Gift[] }>('/api/gifts').then((r) => {
      setLoading(false);
      if (r.success) setGifts(r.data.gifts);
    });
  }, []);

  async function markSeen(id: string) {
    await apiFetch(`/api/gifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'SEEN' }),
    });
    setGifts((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) return null;

  if (gifts.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No gifts yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {gifts.map((gift) => (
        <Card key={gift.id} className="flex items-center justify-between p-4">
          <div>
            <span className="text-2xl">{GIFT_ICONS[gift.giftType] ?? '🎁'}</span>
            <p className="mt-1 font-medium">
              {gift.fromUser.profile?.displayName ?? 'Someone'} sent a {gift.giftType.replace('_', ' ').toLowerCase()}
            </p>
            {gift.message ? <p className="text-sm text-muted-foreground">&ldquo;{gift.message}&rdquo;</p> : null}
          </div>
          <Button size="sm" variant="outline" onClick={() => void markSeen(gift.id)}>
            Thanks!
          </Button>
        </Card>
      ))}
    </div>
  );
}
