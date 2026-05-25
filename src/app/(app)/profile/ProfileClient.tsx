'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface OwnProfile {
  name: string;
  birthDate: string;
  bio: string | null;
  relationshipIntent: string | null;
  isVerified: boolean;
  plan: string;
  photos: string[];
  prompts: { question: string; answer: string }[];
}

const INTENT_LABELS: Record<string, string> = {
  LONG_TERM: 'Long-term',
  SHORT_TERM: 'Short-term',
  CASUAL: 'Casual',
  FRIENDSHIP: 'Friends',
  NOT_SURE: 'Still figuring it out',
};

const PLAN_LABELS: Record<string, string> = {
  BASIC: 'Basic',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
};

function calcAge(birthDate: string): number {
  const bd = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  return age;
}

export default function ProfileClient({ profile }: { profile: OwnProfile }) {
  const age = calcAge(profile.birthDate);
  const intent = profile.relationshipIntent
    ? INTENT_LABELS[profile.relationshipIntent] ?? profile.relationshipIntent
    : null;
  const planLabel = PLAN_LABELS[profile.plan] ?? profile.plan;
  const showPlanBadge = profile.plan !== 'BASIC';

  return (
    <div className="h-full overflow-y-auto pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-90 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.49.49 0 0 0-.48-.41h-3.84a.49.49 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94 0 .32.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.13.22.39.3.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" />
          </svg>
        </Link>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100">
          {/* Photo carousel */}
          {profile.photos.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {profile.photos.map((url, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-full snap-start"
                  style={{ aspectRatio: '4/5' }}
                >
                  <Image src={url} alt={`${profile.name} photo ${i + 1}`} fill className="object-cover" />
                  {profile.photos.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full">
                      {i + 1}/{profile.photos.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="w-full bg-gray-100 flex flex-col items-center justify-center gap-2 text-gray-400"
              style={{ aspectRatio: '4/5' }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <p className="text-sm">No photos yet</p>
            </div>
          )}

          {/* Info */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.name}, {age}
              </h2>
              {profile.isVerified && (
                <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {showPlanBadge && (
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {planLabel}
                </span>
              )}
              {intent && (
                <span className="bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1 rounded-full">
                  {intent}
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-700 text-sm leading-relaxed mb-5 whitespace-pre-line">
                {profile.bio}
              </p>
            )}

            {profile.prompts.length > 0 && (
              <div className="space-y-3">
                {profile.prompts.map((p, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-gray-500 text-xs mb-1">{p.question}</p>
                    <p className="text-gray-900 text-sm font-medium">{p.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-3">
          <Link
            href="/settings"
            className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="font-medium text-gray-900">Edit profile &amp; preferences</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
          <Link
            href="/settings/subscription"
            className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="font-medium text-gray-900">Manage subscription</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
