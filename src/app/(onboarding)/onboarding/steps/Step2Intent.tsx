'use client';

import { useState } from 'react';
import { saveIntent } from '@/app/actions/onboarding';

const INTENT_OPTIONS = [
  {
    value: 'LONG_TERM',
    icon: '💍',
    title: 'Serious Relationship',
    description: 'Looking for something meaningful and long-lasting',
  },
  {
    value: 'SHORT_TERM',
    icon: '✨',
    title: 'Casual Dating',
    description: 'Keeping it light and seeing where things go',
  },
  {
    value: 'CASUAL',
    icon: '🌈',
    title: 'Open to Both',
    description: 'Not sure yet — open to whatever feels right',
  },
  {
    value: 'FRIENDSHIP',
    icon: '🤝',
    title: 'Just Friends',
    description: 'Meeting new people and expanding my social circle',
  },
];

interface Props {
  onNext: () => void;
}

export default function Step2Intent({ onNext }: Props) {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected) { setError('Please select an option.'); return; }
    setLoading(true);
    setError('');
    const result = await saveIntent(selected);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    onNext();
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">What are you looking for?</h1>
      <p className="text-foreground/60 mb-6">Your answer is shown on your profile</p>

      <div className="space-y-3 mb-6">
        {INTENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 ${
              selected === opt.value
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-primary-100 bg-white hover:border-primary-300'
            }`}
          >
            <span className="text-2xl mt-0.5 flex-shrink-0">{opt.icon}</span>
            <div>
              <p className={`font-semibold text-base ${selected === opt.value ? 'text-primary-700' : 'text-foreground'}`}>
                {opt.title}
              </p>
              <p className="text-sm text-foreground/60 mt-0.5">{opt.description}</p>
            </div>
            {selected === opt.value && (
              <span className="ml-auto flex-shrink-0 text-primary-500 text-xl">✓</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || !selected}
        className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
