'use client';

import { useActionState, useRef, useState } from 'react';
import { requestOTPAction, type AuthActionState } from '@/app/actions/auth';

const COUNTRY_CODES = [
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
] as const;

export default function LoginForm() {
  const [countryCode, setCountryCode] = useState('+971');
  const [localNumber, setLocalNumber] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);

  const actionWithPhone = async (_prev: AuthActionState, formData: FormData): Promise<AuthActionState> => {
    formData.set('phone', countryCode + localNumber.replace(/\D/g, ''));
    return requestOTPAction(_prev, formData);
  };

  const [state, formAction, isPending] = useActionState(actionWithPhone, undefined);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];

  return (
    <form action={formAction} className="w-full space-y-5">
      <div className="space-y-2">
        <label htmlFor="local-number" className="block text-sm font-medium text-gray-700">
          Phone number
        </label>
        <div className="flex gap-2">
          {/* Country code selector */}
          <div className="relative">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-12 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm font-medium text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Phone number input */}
          <input
            ref={phoneRef}
            id="local-number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={selectedCountry.code === '+971' ? '50 123 4567' : 'Number'}
            value={localNumber}
            onChange={(e) => setLocalNumber(e.target.value)}
            className="h-12 flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
            required
          />
        </div>

        <p className="text-xs text-gray-400">
          {selectedCountry.flag} {selectedCountry.name} · {selectedCountry.code}
        </p>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || localNumber.replace(/\D/g, '').length < 7}
        className="w-full h-12 rounded-xl bg-primary-500 font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending code…
          </span>
        ) : (
          'Send code'
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        By continuing you agree to our{' '}
        <a href="/terms" className="text-primary-500 hover:underline">Terms</a>
        {' '}and{' '}
        <a href="/privacy" className="text-primary-500 hover:underline">Privacy Policy</a>
      </p>
    </form>
  );
}
