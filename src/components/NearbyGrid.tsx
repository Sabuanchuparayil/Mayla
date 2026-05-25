'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import ProfileModal from './ProfileModal';

interface NearbyProfile {
  userId: string;
  name: string;
  birthDate: string;
  primaryPhotoUrl: string;
  distanceKm?: number;
  isVerified?: boolean;
  relationshipIntent?: string;
  promptQuestion?: string;
  promptAnswer?: string;
  photos?: string[];
  prompts?: Array<{ question: string; answer: string }>;
  genderDisplay?: string;
}

function calcAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

export default function NearbyGrid() {
  const [profiles, setProfiles] = useState<NearbyProfile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<NearbyProfile | null>(null);

  const fetchProfiles = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const res = await fetch(`/api/discovery/nearby?page=${pageNum}`);
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { profiles?: NearbyProfile[]; hasMore?: boolean } | NearbyProfile[];
      const items = Array.isArray(data) ? data : (data.profiles ?? []);
      const more = Array.isArray(data) ? items.length > 0 : (data.hasMore ?? items.length > 0);
      setProfiles((prev) => (append ? [...prev, ...items] : items));
      setHasMore(more);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles(1, false);
  }, [fetchProfiles]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchProfiles(nextPage, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No one nearby</p>
        <p className="text-gray-400 text-sm">Try expanding your distance preferences</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 p-4">
        {profiles.map((profile) => {
          const age = calcAge(profile.birthDate);
          return (
            <button
              key={profile.userId}
              className="relative rounded-2xl overflow-hidden shadow-md bg-gray-200 active:scale-95 transition-transform"
              style={{ aspectRatio: '3/4' }}
              onClick={() => setSelectedProfile(profile)}
            >
              <Image
                src={profile.primaryPhotoUrl}
                alt={profile.name}
                fill
                className="object-cover"
              />

              {/* Verified badge */}
              {profile.isVerified && (
                <div className="absolute top-2 left-2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              )}

              {/* Distance */}
              {profile.distanceKm !== undefined && (
                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {profile.distanceKm < 1
                    ? '< 1 km'
                    : `${Math.round(profile.distanceKm)} km`}
                </div>
              )}

              {/* Bottom gradient + name */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-left">
                <p className="text-xs font-semibold leading-tight">
                  {profile.name}, {age}
                </p>
                {profile.relationshipIntent && (
                  <p className="text-[10px] text-white/70 mt-0.5 truncate">
                    {profile.relationshipIntent}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-white border border-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={() => setSelectedProfile(null)}
        />
      )}
    </>
  );
}
