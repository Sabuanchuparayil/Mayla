'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

type SquadSummary = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  unlocked: boolean;
  boostActive: boolean;
  role: 'OWNER' | 'MEMBER';
  inviteLink: string;
};

type SquadDetail = SquadSummary & {
  members: { userId: string; displayName: string; role: string }[];
  vouchCount: number;
};

type DiscoverProfile = {
  userId: string;
  displayName: string;
  photos: string[];
  city: string | null;
  vouchCount: number;
  vouchedBy: string[];
};

const UNLOCK_AT = 3;

export function SquadPanel() {
  const [squads, setSquads] = useState<SquadSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SquadDetail | null>(null);
  const [feed, setFeed] = useState<DiscoverProfile[]>([]);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadSquads() {
    const r = await apiFetch<{ squads: SquadSummary[] }>('/api/squads');
    setLoading(false);
    if (r.success) {
      setSquads(r.data.squads);
      if (r.data.squads[0] && !activeId) setActiveId(r.data.squads[0].id);
    }
  }

  useEffect(() => {
    void loadSquads();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      setFeed([]);
      return;
    }
    apiFetch<{ squad: SquadDetail }>(`/api/squads/${activeId}`).then((r) => {
      if (r.success) setDetail(r.data.squad);
    });
    apiFetch<{ feed: DiscoverProfile[] }>(`/api/squads/${activeId}?discover=1`).then((r) => {
      if (r.success) setFeed(r.data.feed);
    });
  }, [activeId]);

  async function createSquad() {
    if (newName.trim().length < 2) return;
    const r = await apiFetch<{ squad: SquadSummary }>('/api/squads', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (r.success) {
      setNewName('');
      await loadSquads();
      setActiveId(r.data.squad.id);
    }
  }

  async function joinSquad() {
    const r = await apiFetch<{ squad: SquadDetail }>('/api/squads/join', {
      method: 'POST',
      body: JSON.stringify({ code: joinCode }),
    });
    if (r.success) {
      setJoinCode('');
      await loadSquads();
      setActiveId(r.data.squad.id);
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-warm-200/50 dark:bg-warm-400/10" />;
  }

  return (
    <Card>
      <CardHeader
        title="Your squad"
        description="Bring your friend group — unlock Squad Discover when 3 members join."
      />

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="squadName">Create a squad</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="squadName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Dubai Brunch Girls"
              />
              <Button variant="outline" onClick={() => void createSquad()}>
                Create
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="joinSquad">Join with code</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="joinSquad"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="SQUADCODE"
              />
              <Button variant="outline" onClick={() => void joinSquad()}>
                Join
              </Button>
            </div>
          </div>
        </div>

        {squads.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {squads.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeId === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-card-border bg-card/50 text-muted-foreground'
                }`}
              >
                {s.name} ({s.memberCount})
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No squads yet — create one or join with a friend&apos;s code.</p>
        )}

        {detail ? (
          <div className="rounded-xl border border-card-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{detail.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-mono">{detail.code}</span> · {detail.memberCount}/{UNLOCK_AT} to unlock
                </p>
              </div>
              {detail.boostActive ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Squad boost active
                </span>
              ) : null}
            </div>

            <ul className="space-y-1 text-sm">
              {detail.members.map((m) => (
                <li key={m.userId} className="flex justify-between">
                  <span>{m.displayName}</span>
                  <span className="text-xs text-muted-foreground">{m.role === 'OWNER' ? 'Owner' : 'Member'}</span>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(detail.inviteLink)}
            >
              Copy squad invite link
            </Button>

            {detail.unlocked ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Squad Discover</h4>
                {feed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No vouched profiles yet — like someone in Discover and vouch for them here.</p>
                ) : (
                  <ul className="space-y-2">
                    {feed.map((p) => (
                      <li key={p.userId} className="rounded-lg border border-card-border p-3 text-sm">
                        <p className="font-medium">{p.displayName}</p>
                        {p.city ? <p className="text-xs text-muted-foreground">{p.city}</p> : null}
                        {p.vouchedBy.length > 0 ? (
                          <p className="mt-1 text-xs text-primary">
                            Vouched by {p.vouchedBy.join(', ')}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Squad challenge: invite {UNLOCK_AT - detail.memberCount} more friend
                {UNLOCK_AT - detail.memberCount === 1 ? '' : 's'} this week to unlock Squad Discover for everyone.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
