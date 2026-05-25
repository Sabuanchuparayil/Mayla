'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

type DateRequestItem = {
  id: string;
  message: string | null;
  proposedDay: string | null;
  proposedTime: string | null;
  status: string;
  fromUser?: {
    id: string;
    verified: boolean;
    profile: { displayName: string; city: string | null } | null;
  };
  toUser?: {
    id: string;
    verified: boolean;
    profile: { displayName: string; city: string | null } | null;
  };
};

export function DateRequestInbox() {
  const [incoming, setIncoming] = useState<DateRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const result = await apiFetch<{ incoming: DateRequestItem[] }>('/api/date-requests');
    setLoading(false);
    if (result.success) {
      setIncoming(result.data.incoming.filter((r) => r.status === 'PENDING'));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function respond(id: string, action: 'ACCEPT' | 'DECLINE') {
    setActing(id);
    const result = await apiFetch(`/api/date-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    setActing(null);
    if (result.success) {
      await load();
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (incoming.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No pending date requests</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {incoming.map((req) => {
        const name = req.fromUser?.profile?.displayName ?? 'Someone';
        return (
          <Card key={req.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{name} wants to meet up</p>
                {req.message ? (
                  <p className="mt-1 text-sm text-muted-foreground">&ldquo;{req.message}&rdquo;</p>
                ) : null}
                {req.proposedDay && req.proposedTime ? (
                  <p className="mt-1 text-xs text-primary">
                    Suggested: {req.proposedDay} · {req.proposedTime}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                loading={acting === req.id}
                onClick={() => void respond(req.id, 'ACCEPT')}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={acting === req.id}
                onClick={() => void respond(req.id, 'DECLINE')}
              >
                Decline
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
