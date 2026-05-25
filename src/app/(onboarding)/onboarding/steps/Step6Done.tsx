'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  name: string;
}

export default function Step6Done({ name }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const displayName = name.trim() || 'there';

  return (
    <div className="px-4 py-12 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Animated verified badge */}
      <div
        className={`transition-all duration-700 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="relative mb-8">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-full bg-primary-200 animate-ping opacity-30" />
          {/* Inner badge */}
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center shadow-lg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-14 h-14 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
            </svg>
          </div>
          {/* Small star decorations */}
          <span className="absolute -top-2 -right-2 text-xl">✨</span>
          <span className="absolute -bottom-1 -left-3 text-lg">🌟</span>
        </div>
      </div>

      {/* Text */}
      <div
        className={`text-center transition-all duration-700 delay-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          You're all set, {displayName}!
        </h1>
        <p className="text-foreground/60 text-base mb-2">
          Your profile is ready to be discovered.
        </p>
        <p className="text-foreground/40 text-sm mb-10">
          Start swiping and find your match
        </p>
      </div>

      {/* CTA */}
      <div
        className={`w-full max-w-xs transition-all duration-700 delay-500 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button
          type="button"
          onClick={() => router.push('/discover')}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold text-base hover:from-primary-600 hover:to-secondary-600 transition-all shadow-lg shadow-primary-200 active:scale-95"
        >
          Start Discovering 💫
        </button>
      </div>

      <style>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
