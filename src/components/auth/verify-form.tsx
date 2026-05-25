'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') ?? '';

  const [phone, setPhone] = useState(phoneParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendCode() {
    setError('');
    setLoading(true);
    const result = await apiFetch<{ expiresIn: number; debugCode?: string }>('/api/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setSent(true);
    if (result.data.debugCode) {
      setCode(result.data.debugCode);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await apiFetch<{ user: { onboardingCompleted: boolean } }>(
      '/api/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      },
    );
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.push(result.data.user.onboardingCompleted ? '/dashboard' : '/onboarding');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Verify your phone"
        description="Enter the 6-digit code sent to your number. Use 123456 in development."
      />
      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+971501234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {!sent ? (
          <Button type="button" className="w-full" loading={loading} onClick={sendCode}>
            Send code
          </Button>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div>
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Verify & continue
            </Button>
          </form>
        )}
      </div>
    </Card>
  );
}
