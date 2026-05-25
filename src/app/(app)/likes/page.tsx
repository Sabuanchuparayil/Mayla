'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProfileModal from '@/components/ProfileModal';
import type { DiscoveryCard } from '@/lib/discovery-cards';

interface LikesResponse {
  locked: boolean;
  count: number;
  profiles: DiscoveryCard[];
}

function calcAge(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function LikesPage() {
  const [data, setData] = useState<LikesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/discovery/likes');
        if (!res.ok) throw new Error('Failed');
        const json = (await res.json()) as LikesResponse;
        if (active) setData(json);
      } catch {
        if (active) setData({ locked: false, count: 0, profiles: [] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Likes You</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : data?.locked ? (
        <LockedTeaser count={data.count} />
      ) : data && data.profiles.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 p-4">
            {data.profiles.map((profile, idx) => {
              const age = calcAge(profile.birthDate);
              return (
                <button
                  key={profile.userId}
                  className="relative rounded-2xl overflow-hidden shadow-md bg-gray-200 active:scale-95 transition-transform"
                  style={{ aspectRatio: '3/4' }}
                  onClick={() => setSelectedIndex(idx)}
                >
                  {profile.primaryPhotoUrl ? (
                    <Image src={profile.primaryPhotoUrl} alt={profile.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}

                  {profile.isVerified && (
                    <div className="absolute top-2 left-2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-left">
                    <p className="text-xs font-semibold leading-tight">
                      {profile.name}, {age}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedIndex !== null && data.profiles[selectedIndex] && (
            <ProfileModal
              profile={data.profiles[selectedIndex]}
              onClose={() => setSelectedIndex(null)}
              onLike={() => setSelectedIndex(null)}
              onPrev={selectedIndex > 0 ? () => setSelectedIndex((i) => (i ?? 0) - 1) : undefined}
              onNext={
                selectedIndex < data.profiles.length - 1
                  ? () => setSelectedIndex((i) => (i ?? 0) + 1)
                  : undefined
              }
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#E85D75">
              <path d="M12 17.27l-4.95 2.96 1.31-5.64L4 10.76l5.77-.5L12 5l2.23 5.26 5.77.5-4.36 3.83 1.31 5.64z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No likes yet — keep swiping!</p>
          <Link
            href="/discover"
            className="text-primary-500 text-sm font-medium mt-1"
          >
            Go to Discover
          </Link>
        </div>
      )}
    </div>
  );
}

function LockedTeaser({ count }: { count: number }) {
  const headline = count > 0 ? `${count} ${count === 1 ? 'person likes' : 'people like'} you` : 'See who likes you';

  return (
    <div className="relative p-4">
      <div className="grid grid-cols-2 gap-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-secondary-100 blur-md"
            style={{ aspectRatio: '3/4' }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3">
        <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#E85D75">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{headline}</h2>
        <p className="text-gray-600 text-sm max-w-xs">
          Upgrade to Gold to see everyone who liked you
        </p>
        <Link
          href="/settings/subscription"
          className="mt-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          Upgrade to Gold
        </Link>
      </div>
    </div>
  );
}
