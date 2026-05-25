'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

type PhotoUploadProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
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

export function PhotoUpload({ photos, onChange, max = 6 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={`${photo}-${i}`} className="relative aspect-[3/4] overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvePhotoUrl(photo)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
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
      <p className="text-xs text-muted-foreground">Up to {max} photos. First photo is your main discover image.</p>
      {photos.length > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={uploading}
          onClick={async () => {
            setUploading(true);
            await apiFetch('/api/users/me/profile', {
              method: 'PATCH',
              body: JSON.stringify({ photos }),
            });
            setUploading(false);
          }}
        >
          Save photos
        </Button>
      ) : null}
    </div>
  );
}
