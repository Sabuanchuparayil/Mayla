'use client';

import Image from 'next/image';

interface ProfileCardProfile {
  userId: string;
  name: string;
  birthDate: string;
  primaryPhotoUrl: string;
  distanceKm?: number;
  isVerified?: boolean;
  relationshipIntent?: string;
  promptQuestion?: string;
  promptAnswer?: string;
}

interface ProfileCardProps {
  profile: ProfileCardProfile;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

function calcAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

export default function ProfileCard({
  profile,
  onClick,
  style,
  className = '',
}: ProfileCardProps) {
  const age = calcAge(profile.birthDate);

  return (
    <div
      className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer select-none ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* Photo */}
      <Image
        src={profile.primaryPhotoUrl}
        alt={profile.name}
        fill
        className="object-cover"
        draggable={false}
        priority
      />

      {/* Distance badge */}
      {profile.distanceKm !== undefined && (
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
          {profile.distanceKm < 1
            ? '< 1 km'
            : `${Math.round(profile.distanceKm)} km`}
        </div>
      )}

      {/* Verified badge */}
      {profile.isVerified && (
        <div className="absolute top-3 left-3 bg-blue-500 rounded-full w-7 h-7 flex items-center justify-center shadow-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {/* Name + age */}
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold">
            {profile.name}, {age}
          </h2>
        </div>

        {/* Intent pill */}
        {profile.relationshipIntent && (
          <div className="inline-flex items-center mb-3">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
              {profile.relationshipIntent}
            </span>
          </div>
        )}

        {/* Prompt */}
        {profile.promptQuestion && profile.promptAnswer && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
            <p className="text-white/70 text-xs mb-1">{profile.promptQuestion}</p>
            <p className="text-white text-sm font-medium line-clamp-2">
              {profile.promptAnswer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
