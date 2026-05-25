'use client';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DiscoverError({ error, reset }: ErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h2 className="text-xl font-semibold text-foreground">Failed to load profiles</h2>
        <p className="text-sm text-zinc-500">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
