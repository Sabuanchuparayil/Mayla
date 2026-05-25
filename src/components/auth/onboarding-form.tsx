'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

export function OnboardingForm({ defaultName }: { defaultName?: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await apiFetch<{ user: unknown }>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader
        title="Almost there"
        description="Tell us a bit about yourself to complete your profile"
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200/50">
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            required
            placeholder="How should others see you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Continue to Mayla
        </Button>
      </form>
    </Card>
  );
}
