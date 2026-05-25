'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') ?? '/dashboard';
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') && !rawRedirect.includes('://')
      ? rawRedirect
      : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await apiFetch<{ user: { onboardingCompleted: boolean } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    const destination = result.data.user.onboardingCompleted ? redirect : '/onboarding';
    router.push(destination);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader title="Welcome back" description="Sign in to continue your journey" />
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200/50 dark:border-red-800/30">
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline decoration-primary/30 underline-offset-4">
            Create one
          </Link>
        </p>
        <Link href="/verify" className="font-medium text-primary/70 hover:text-primary transition-colors">
          Sign in with phone instead
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground/60 hover:text-primary transition-colors">
          Forgot password?
        </Link>
      </div>
    </Card>
  );
}
