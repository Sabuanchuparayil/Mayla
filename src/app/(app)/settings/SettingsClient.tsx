'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Account, Preferences, Privacy } from './page';

interface Props {
  initialPreferences: Preferences;
  initialPrivacy: Privacy;
  initialAccount: Account | null;
}

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'MAN', label: 'Men' },
  { value: 'WOMAN', label: 'Women' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
];

export default function SettingsClient({ initialPreferences, initialPrivacy, initialAccount }: Props) {
  const router = useRouter();

  // ── Preferences state ──
  const [prefs, setPrefs] = useState<Preferences>({
    minAgePreference: initialPreferences.minAgePreference ?? 18,
    maxAgePreference: initialPreferences.maxAgePreference ?? 50,
    maxDistance: initialPreferences.maxDistance ?? 50,
    genderPreference: initialPreferences.genderPreference ?? [],
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Privacy state ──
  const [isVisible, setIsVisible] = useState(initialPrivacy.isVisible);
  const [privacySaving, setPrivacySaving] = useState(false);

  // ── Account ──
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Save preferences ──
  async function savePreferences() {
    setPrefSaving(true);
    setPrefMsg(null);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minAgePreference: Number(prefs.minAgePreference),
          maxAgePreference: Number(prefs.maxAgePreference),
          maxDistance: Number(prefs.maxDistance),
          genderPreference: prefs.genderPreference,
        }),
      });
      if (res.ok) {
        setPrefMsg({ ok: true, text: 'Preferences saved!' });
      } else {
        const json = (await res.json()) as { error?: string };
        setPrefMsg({ ok: false, text: json.error ?? 'Failed to save preferences.' });
      }
    } catch {
      setPrefMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setPrefSaving(false);
    }
  }

  // ── Toggle privacy ──
  async function togglePrivacy(newValue: boolean) {
    setIsVisible(newValue);
    setPrivacySaving(true);
    try {
      await fetch('/api/user/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newValue }),
      });
    } catch {
      // revert optimistic update on error
      setIsVisible(!newValue);
    } finally {
      setPrivacySaving(false);
    }
  }

  // ── Log out ──
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  }

  // ── Delete account ──
  async function handleDeleteAccount() {
    const confirmed = window.confirm('Are you sure? This cannot be undone.');
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      await fetch('/api/user/account', { method: 'DELETE' });
    } finally {
      window.location.href = '/login';
    }
  }

  // ── Gender preference toggle ──
  function toggleGender(value: string) {
    setPrefs((prev) => {
      const current = prev.genderPreference ?? [];
      const next = current.includes(value)
        ? current.filter((g) => g !== value)
        : [...current, value];
      return { ...prev, genderPreference: next };
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

        {/* ── Section 1: My Account ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">My Account</h2>

          {initialAccount && (
            <div className="space-y-1">
              {initialAccount.profile?.name && (
                <p className="text-sm font-medium text-gray-800">{initialAccount.profile.name}</p>
              )}
              {initialAccount.email && (
                <p className="text-sm text-gray-500">{initialAccount.email}</p>
              )}
              {initialAccount.phone && (
                <p className="text-sm text-gray-500">{initialAccount.phone}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-[#E85D75] text-[#E85D75] hover:bg-[#E85D75] hover:text-white transition-colors disabled:opacity-60"
            >
              {loggingOut ? 'Logging out…' : 'Log Out'}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {deletingAccount ? 'Deleting…' : 'Delete Account'}
            </button>
          </div>
        </section>

        {/* ── Section 2: Discovery Preferences ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Discovery Preferences</h2>

          {/* Distance slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Distance</label>
              <span className="text-sm font-semibold text-[#E85D75]">
                Up to {prefs.maxDistance ?? 50} km
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={500}
              value={prefs.maxDistance ?? 50}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, maxDistance: Number(e.target.value) }))
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#E85D75]"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 km</span>
              <span>500 km</span>
            </div>
          </div>

          {/* Age range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Age Range</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-gray-400">Min</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={prefs.minAgePreference ?? 18}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, minAgePreference: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E85D75]/40"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-gray-400">Max</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={prefs.maxAgePreference ?? 50}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, maxAgePreference: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E85D75]/40"
                />
              </div>
            </div>
          </div>

          {/* Show me */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Show me</label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map(({ value, label }) => {
                const checked = (prefs.genderPreference ?? []).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleGender(value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      checked
                        ? 'bg-[#E85D75] border-[#E85D75] text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#E85D75] hover:text-[#E85D75]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? 'bg-white border-white' : 'border-current'
                      }`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-[#E85D75]" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={savePreferences}
            disabled={prefSaving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#E85D75] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {prefSaving ? 'Saving…' : 'Save Preferences'}
          </button>

          {prefMsg && (
            <p className={`text-xs font-medium ${prefMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {prefMsg.text}
            </p>
          )}
        </section>

        {/* ── Section 3: Privacy ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Privacy</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Show my profile in discovery</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isVisible ? 'Others can discover your profile' : 'Your profile is hidden from discovery'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isVisible}
              onClick={() => !privacySaving && togglePrivacy(!isVisible)}
              disabled={privacySaving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                isVisible ? 'bg-[#E85D75]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  isVisible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── Section 4: Subscription ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Subscription</h2>
          <Link
            href="/settings/subscription"
            className="flex items-center justify-between text-sm font-medium text-gray-700 hover:text-[#E85D75] transition-colors group"
          >
            <span>Manage Subscription</span>
            <span className="text-gray-400 group-hover:text-[#E85D75] transition-colors">→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
