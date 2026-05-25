'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="glass-card max-w-md p-8 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          We hit an unexpected issue. Please try again or go back.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-primary/20 px-6 py-2 text-sm font-medium text-primary"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
