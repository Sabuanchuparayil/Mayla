'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

export function ProfileEditor() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [verified, setVerified] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<{ user: { name: string | null; verified: boolean } }>('/api/auth/me').then((r) => {
      if (r.success) {
        setDisplayName(r.data.user.name ?? '');
        setVerified(r.data.user.verified);
      }
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const tags = interests
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await apiFetch('/api/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, bio, interests: tags }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <Card>
        <CardHeader
          title="Your profile"
          description={
            verified
              ? 'You are verified and visible to others'
              : 'Complete selfie verification to appear in Discover'
          }
        />

        {!verified ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-50/80 p-4 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-amber-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Verification needed</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-300/60">Take a selfie to unlock full features</p>
            </div>
            <Button href="/verify/selfie" size="sm">
              Verify
            </Button>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50/80 px-4 py-3 border border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Profile verified</span>
          </div>
        )}

        <form onSubmit={save} className="space-y-5">
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How others see you" />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A little about yourself..." />
          </div>
          <div>
            <Label htmlFor="interests">Interests</Label>
            <Input id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="coffee, travel, fitness" />
            <p className="mt-1.5 text-xs text-muted-foreground/60">Separate with commas</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Save profile</Button>
            {saved ? (
              <span className="animate-fade-up text-sm font-medium text-emerald-600">
                Saved successfully
              </span>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
