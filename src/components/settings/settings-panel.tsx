'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoutButton } from '@/components/auth/logout-button';
import { apiFetch } from '@/lib/api/client';

export function SettingsPanel() {
  const [tier, setTier] = useState('FREE');
  const [swipesUsed, setSwipesUsed] = useState(0);
  const [swipeLimit, setSwipeLimit] = useState<number | null>(5);
  const [travelMode, setTravelMode] = useState(false);
  const [travelCity, setTravelCity] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<{ tier: string; swipesUsedToday: number; swipeLimit: number | null }>(
      '/api/billing/subscription',
    ).then((r) => {
      if (r.success) {
        setTier(r.data.tier);
        setSwipesUsed(r.data.swipesUsedToday);
        setSwipeLimit(r.data.swipeLimit);
      }
    });
  }, []);

  async function mockUpgrade(plan: 'GOLD' | 'PLATINUM') {
    const result = await apiFetch<{ message: string }>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier: plan }),
    });
    if (result.success) {
      setMessage(result.data.message);
      setTier(plan);
      setSwipeLimit(null);
    }
  }

  async function saveTravelMode() {
    await apiFetch('/api/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        travelModeEnabled: travelMode,
        travelCity: travelCity || null,
        travelLatitude: travelMode ? 25.2048 : null,
        travelLongitude: travelMode ? 55.2708 : null,
      }),
    });
    setMessage('Travel mode updated');
    setTimeout(() => setMessage(''), 3000);
  }

  async function exportData() {
    window.open('/api/users/me/export', '_blank');
  }

  async function deleteAccount() {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    await apiFetch('/api/users/me', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Subscription */}
      <Card>
        <CardHeader title="Subscription" description={`Current plan: ${tier}`} />
        <div className="mb-5 flex items-center gap-2">
          <div className="flex gap-1">
            {swipeLimit != null ? (
              Array.from({ length: swipeLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-5 rounded-full transition-colors ${
                    i < swipesUsed ? 'bg-warm-300' : 'bg-primary'
                  }`}
                />
              ))
            ) : (
              <span className="text-sm text-emerald-600 font-medium">Unlimited swipes</span>
            )}
          </div>
          {swipeLimit != null ? (
            <span className="text-xs text-muted-foreground">{swipesUsed}/{swipeLimit} today</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => mockUpgrade('GOLD')}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-amber-500">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Upgrade to Gold
          </Button>
          <Button variant="secondary" onClick={() => mockUpgrade('PLATINUM')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            Upgrade to Platinum
          </Button>
        </div>
      </Card>

      {/* Travel mode */}
      <Card>
        <CardHeader title="Travel mode" description="Discover people in another city" />
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={travelMode}
                onChange={(e) => setTravelMode(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-warm-300 transition-colors peer-checked:bg-primary dark:bg-warm-400/30" />
              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="font-medium">Enable travel mode</span>
          </label>
          <div>
            <Label htmlFor="travelCity">Destination city</Label>
            <Input id="travelCity" value={travelCity} onChange={(e) => setTravelCity(e.target.value)} placeholder="Dubai" />
          </div>
          <Button variant="outline" onClick={saveTravelMode}>
            Save travel settings
          </Button>
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader title="Privacy & data" description="Your data, your control" />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportData}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export my data
          </Button>
          <Button variant="danger" onClick={deleteAccount}>
            Delete account
          </Button>
        </div>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader title="Session" />
        <LogoutButton />
      </Card>

      {/* Toast */}
      {message ? (
        <div className="animate-fade-up fixed bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg md:bottom-8">
          {message}
        </div>
      ) : null}
    </div>
  );
}
