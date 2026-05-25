import { Suspense } from 'react';
import { VerifyForm } from '@/components/auth/verify-form';

export default function VerifyPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
