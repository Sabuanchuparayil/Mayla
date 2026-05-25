'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await apiFetch<{ debugCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    if (result.data.debugCode) setToken(result.data.debugCode);
    setStep('reset');
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await apiFetch<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'PUT',
      body: JSON.stringify({ email, token, password }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    if (result.data.success) router.push('/login');
    else setError(result.data.message);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Reset password"
        description={step === 'email' ? 'We will send a reset code (mock: 654321 in dev).' : 'Enter the code and new password.'}
      />
      {step === 'email' ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div>
            <Label htmlFor="token">Reset code</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Update password
          </Button>
        </form>
      )}
    </Card>
  );
}
