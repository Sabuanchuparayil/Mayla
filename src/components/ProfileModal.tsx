'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface ProfileModalProfile {
  userId: string;
  name: string;
  birthDate: string;
  primaryPhotoUrl: string;
  photos?: string[];
  distanceKm?: number;
  isVerified?: boolean;
  relationshipIntent?: string;
  genderDisplay?: string;
  prompts?: Array<{ question: string; answer: string }>;
}

interface ProfileModalProps {
  profile: ProfileModalProfile;
  onClose: () => void;
  onLike?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function calcAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

export default function ProfileModal({ profile, onClose, onLike, onPrev, onNext }: ProfileModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const age = calcAge(profile.birthDate);
  const allPhotos = [profile.primaryPhotoUrl, ...(profile.photos ?? [])].filter(Boolean);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Prevent body scroll + wire arrow keys for prev/next while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev?.();
      else if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full bg-white rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '92dvh',
          animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        {/* Prev / Next profile navigation */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute top-1/3 left-3 z-10 bg-black/40 backdrop-blur-sm text-white rounded-full w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Previous profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute top-1/3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white rounded-full w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Next profile"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        )}

        <div className="overflow-y-auto" style={{ maxHeight: '92dvh' }}>
          {/* Photo gallery */}
          <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
            {allPhotos.map((url, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 w-full snap-start"
                style={{ height: '60vw', maxHeight: '420px' }}
              >
                <Image
                  src={url}
                  alt={`${profile.name} photo ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Info section */}
          <div className="p-5 pb-28">
            {/* Name + age */}
            <div className="flex items-center gap-2 mb-1">
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

            {/* Distance */}
            {profile.distanceKm !== undefined && (
              <p className="text-gray-500 text-sm mb-3">
                {profile.distanceKm < 1
                  ? '< 1 km away'
                  : `${Math.round(profile.distanceKm)} km away`}
              </p>
            )}

            {/* Pills row */}
            <div className="flex flex-wrap gap-2 mb-5">
              {profile.relationshipIntent && (
                <span className="bg-primary-50 text-primary-600 text-xs font-medium px-3 py-1 rounded-full">
                  {profile.relationshipIntent}
                </span>
              )}
              {profile.genderDisplay && (
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                  {profile.genderDisplay}
                </span>
              )}
            </div>

            {/* Prompts */}
            {profile.prompts && profile.prompts.length > 0 && (
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

        {/* Fixed like button */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onLike}
            className="w-full bg-primary-500 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Like {profile.name}
          </button>
        </div>
      </div>
    </div>
  );
}
