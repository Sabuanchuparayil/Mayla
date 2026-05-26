'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';
import {
  MAIN_PHOTO_INDEX,
  remapBlurredIndicesAfterRemoval,
  remapBlurredIndicesAfterReorder,
  sanitizeBlurredPhotoIndices,
} from '@/lib/photo-privacy';

type PhotoUploadProps = {
  photos: string[];
  blurredPhotoIndices: number[];
  canControlBlur: boolean;
  onChange: (photos: string[]) => void;
  onBlurIndicesChange?: (indices: number[]) => void;
  max?: number;
};

function resolvePhotoUrl(keyOrUrl: string): string {
  if (keyOrUrl.startsWith('http') || keyOrUrl.startsWith('blob:') || keyOrUrl.startsWith('data:')) {
    return keyOrUrl;
  }
  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;
  const region = process.env.NEXT_PUBLIC_AWS_REGION ?? 'me-south-1';
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${keyOrUrl}`;
  }
  return keyOrUrl;
}

export function PhotoUpload({
  photos,
  blurredPhotoIndices,
  canControlBlur,
  onChange,
  onBlurIndicesChange,
  max = 6,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function reorderPhotos(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onChange(next);
    onBlurIndicesChange?.(remapBlurredIndicesAfterReorder(blurredPhotoIndices, from, to, next.length));
  }

  function toggleBlur(index: number) {
    if (!canControlBlur || index === MAIN_PHOTO_INDEX) return;
    const next = blurredPhotoIndices.includes(index)
      ? blurredPhotoIndices.filter((i) => i !== index)
      : [...blurredPhotoIndices, index];
    onBlurIndicesChange?.(sanitizeBlurredPhotoIndices(next, photos.length));
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || photos.length >= max) return;
    setError('');
    setUploading(true);

    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= max) break;
      if (!file.type.startsWith('image/')) continue;

      const presign = await apiFetch<{
        key: string;
        uploadUrl: string | null;
        mock: boolean;
      }>('/api/upload/presign', {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type, folder: 'photos' }),
      });

      if (!presign.success) {
        setError(presign.error.message);
        break;
      }

      const { key, uploadUrl, mock } = presign.data;

      if (mock || !uploadUrl) {
        const objectUrl = URL.createObjectURL(file);
        next.push(objectUrl);
      } else {
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!put.ok) {
          setError('Upload failed');
          break;
        }
        next.push(key);
      }
    }

    onChange(next);
    onBlurIndicesChange?.(sanitizeBlurredPhotoIndices(blurredPhotoIndices, next.length));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    onBlurIndicesChange?.(remapBlurredIndicesAfterRemoval(blurredPhotoIndices, index));
  }

  async function savePhotos() {
    setUploading(true);
    setError('');
    const result = await apiFetch('/api/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        photos,
        blurredPhotoIndices: sanitizeBlurredPhotoIndices(blurredPhotoIndices, photos.length),
      }),
    });
    setUploading(false);
    if (!result.success) {
      setError(result.error.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => {
          const isBlurred = blurredPhotoIndices.includes(i);
          const canToggle = canControlBlur && i > MAIN_PHOTO_INDEX;

          return (
            <div
              key={`${photo}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) reorderPhotos(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`relative aspect-[3/4] cursor-grab overflow-hidden rounded-xl active:cursor-grabbing ${
                dragIndex === i ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvePhotoUrl(photo)}
                alt=""
                className={cnPhoto(isBlurred)}
              />
              {isBlurred ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">Blurred</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white"
              >
                ✕
              </button>
              {i === MAIN_PHOTO_INDEX ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                  Main
                </span>
              ) : canToggle ? (
                <button
                  type="button"
                  onClick={() => toggleBlur(i)}
                  className="absolute bottom-1 left-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white hover:bg-primary/80"
                >
                  {isBlurred ? 'Reveal' : 'Blur'}
                </button>
              ) : null}
            </div>
          );
        })}
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-warm-300 text-sm text-muted-foreground hover:border-primary/40 dark:border-warm-400/20"
          >
            {uploading ? 'Uploading...' : '+ Add photo'}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Up to {max} photos. Drag to reorder. Your main photo is always visible on Discover.
      </p>
      {canControlBlur ? (
        <p className="text-xs text-muted-foreground">
          Tap <strong>Blur</strong> on any extra photo to hide it until you match. Tap <strong>Reveal</strong> to show it.
        </p>
      ) : (
        <p className="text-xs text-amber-600">
          Upgrade to Gold to choose which photos stay blurred until match.
        </p>
      )}
      {photos.length > 0 ? (
        <Button type="button" size="sm" variant="outline" loading={uploading} onClick={() => void savePhotos()}>
          Save photos
        </Button>
      ) : null}
    </div>
  );
}

function cnPhoto(blurredPreview: boolean): string {
  return blurredPreview ? 'h-full w-full object-cover blur-sm' : 'h-full w-full object-cover';
}
