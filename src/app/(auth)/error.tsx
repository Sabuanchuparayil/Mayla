'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="glass-card max-w-sm p-8 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-foreground">
          Authentication Error
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
