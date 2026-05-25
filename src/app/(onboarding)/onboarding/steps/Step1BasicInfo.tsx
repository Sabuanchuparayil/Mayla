'use client';

import { useState } from 'react';
import { saveBasicInfo } from '@/app/actions/onboarding';

const GENDERS = [
  { value: 'MAN', label: 'Man' },
  { value: 'WOMAN', label: 'Woman' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
];

const GENDER_PREFS = [
  { value: 'MAN', label: 'Men' },
  { value: 'WOMAN', label: 'Women' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

interface Props {
  onNext: (name: string) => void;
}

export default function Step1BasicInfo({ onNext }: Props) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [genderPreference, setGenderPreference] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleGenderPref = (value: string) => {
    setGenderPreference((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!birthDate) { setError('Please enter your date of birth.'); return; }
    if (!gender) { setError('Please select your gender.'); return; }
    if (genderPreference.length === 0) { setError('Please select who you\'re interested in.'); return; }

    setLoading(true);
    const result = await saveBasicInfo({ name, birthDate, gender, genderPreference });
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onNext(name.trim());
  };

  // Max date: 18 years ago
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateStr = maxDate.toISOString().split('T')[0] ?? '';

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Tell us about you</h1>
      <p className="text-foreground/60 mb-6">Let's start with the basics</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-foreground placeholder:text-foreground/40"
          />
        </div>

        {/* Date of birth */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="dob">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={maxDateStr}
            className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-foreground"
          />
          <p className="text-xs text-foreground/40 mt-1">You must be 18 or older</p>
        </div>

        {/* Gender */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">I am a</p>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                  gender === g.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-primary-100 bg-white text-foreground hover:border-primary-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Looking for */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Interested in</p>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_PREFS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => toggleGenderPref(g.value)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                  genderPreference.includes(g.value)
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-primary-100 bg-white text-foreground hover:border-primary-300'
                }`}
              >
                {g.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGenderPreference(['MAN', 'WOMAN', 'NON_BINARY', 'OTHER'])}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                genderPreference.length === 4
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-primary-100 bg-white text-foreground hover:border-primary-300'
              }`}
            >
              Everyone
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
