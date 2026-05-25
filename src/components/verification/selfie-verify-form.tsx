'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';

export function SelfieVerifyForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleVerify() {
    setError('');
    setLoading(true);

    const presign = await apiFetch<{ key: string; mock?: boolean }>('/api/upload/presign', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'image/jpeg', folder: 'selfies' }),
    });

    if (!presign.success) {
      setLoading(false);
      setError(presign.error.message);
      return;
    }

    const verify = await apiFetch<{ verified: boolean; mock?: boolean }>('/api/verification/selfie', {
      method: 'POST',
      body: JSON.stringify({ imageKey: presign.data.key }),
    });

    setLoading(false);

    if (!verify.success) {
      setError(verify.error.message);
      return;
    }

    if (verify.data.verified) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader
        title="Selfie verification"
        description="Take a live selfie to verify your profile. Mock mode always passes in development."
      />
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Selfie preview" className="mx-auto max-h-64 rounded-lg" />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">No photo selected</p>
          </div>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {done ? (
          <p className="text-sm text-green-700">You&apos;re verified! Discover is now unlocked.</p>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              {preview ? 'Retake' : 'Open camera'}
            </Button>
            <Button loading={loading} disabled={!preview} onClick={handleVerify}>
              Verify selfie
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
