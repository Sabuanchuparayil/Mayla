'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { countLockedPhotos, isPhotoBlurred } from '@/lib/photo-privacy';

type ProfilePhotoGalleryProps = {
  photos: string[];
  displayName: string;
  blurredPhotoIndices?: number[];
  isMatched?: boolean;
  className?: string;
  mainClassName?: string;
};

export function ProfilePhotoGallery({
  photos,
  displayName,
  blurredPhotoIndices = [],
  isMatched = false,
  className,
  mainClassName = 'h-80',
}: ProfilePhotoGalleryProps) {
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? null;
  const blurCurrent = isPhotoBlurred(index, blurredPhotoIndices, isMatched);
  const lockedCount = countLockedPhotos(blurredPhotoIndices, photos.length);

  function goPrev() {
    if (photos.length <= 1) return;
    setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }

  function goNext() {
    if (photos.length <= 1) return;
    setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }

  if (!current) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-accent-100 dark:from-primary-900 dark:via-primary-950 dark:to-accent-900',
          mainClassName,
          className,
        )}
      >
        <span className="font-[family-name:var(--font-playfair)] text-7xl font-semibold text-primary/40">
          {displayName[0]}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', mainClassName, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={current}
        alt={`${displayName}'s photo ${index + 1} of ${photos.length}`}
        className={cn('h-full w-full object-cover transition-all duration-300', blurCurrent && 'scale-105 blur-xl')}
      />
      {blurCurrent ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <span className="mb-2 text-3xl">🔒</span>
          <p className="text-sm font-medium text-white">Match to see this photo</p>
        </div>
      ) : null}
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={goPrev}
            className="absolute left-0 top-0 h-full w-1/3"
          />
          <button
            type="button"
            aria-label="Next photo"
            onClick={goNext}
            className="absolute right-0 top-0 h-full w-1/3"
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                  isPhotoBlurred(i, blurredPhotoIndices, isMatched) && 'ring-1 ring-white/80',
                )}
              />
            ))}
          </div>
          {lockedCount > 0 && !isMatched ? (
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              +{lockedCount} locked
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
