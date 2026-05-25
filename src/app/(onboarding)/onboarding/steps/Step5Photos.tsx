'use client';

import { useState, useRef, useCallback } from 'react';

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 6;

interface PhotoItem {
  id: string;
  file: File;
  localUrl: string;
  status: 'uploading' | 'checking' | 'approved' | 'rejected';
  photoId?: string;
  error?: string;
}

interface Props {
  onNext: () => void;
}

export default function Step5Photos({ onNext }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const approvedCount = photos.filter((p) => p.status === 'approved').length;
  const canContinue = approvedCount >= MIN_PHOTOS;

  const uploadPhoto = useCallback(async (item: PhotoItem, order: number) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: 'uploading' } : p)),
    );

    const formData = new FormData();
    formData.append('image', item.file);
    formData.append('order', String(order));

    try {
      const res = await fetch('/api/verification/photo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json() as { photoId?: string; status?: string; error?: string };

      if (!res.ok || data.error) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: 'rejected', error: data.error ?? 'Upload failed' }
              : p,
          ),
        );
        return;
      }

      // Simulate "checking face" step
      setPhotos((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'checking', photoId: data.photoId } : p)),
      );

      // Short delay to show "checking" then resolve based on server response
      await new Promise((r) => setTimeout(r, 800));

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, status: data.status === 'approved' ? 'approved' : 'rejected' }
            : p,
        ),
      );
    } catch {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: 'rejected', error: 'Network error' } : p,
        ),
      );
    }
  }, []);

  const handleFiles = (files: FileList) => {
    const current = photos.length;
    const available = MAX_PHOTOS - current;
    const toAdd = Array.from(files).slice(0, available);

    const newItems: PhotoItem[] = toAdd.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      file,
      localUrl: URL.createObjectURL(file),
      status: 'uploading',
    }));

    setPhotos((prev) => {
      const updated = [...prev, ...newItems];
      // Trigger uploads
      newItems.forEach((item) => {
        const order = updated.findIndex((p) => p.id === item.id);
        uploadPhoto(item, order);
      });
      return updated;
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.localUrl);
      const filtered = prev.filter((p) => p.id !== id);
      return filtered;
    });
  };

  // Drag and drop reorder
  const dragItemId = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragItemId.current;
    if (!sourceId || sourceId === targetId) { setDragOverId(null); return; }

    setPhotos((prev) => {
      const arr = [...prev];
      const srcIdx = arr.findIndex((p) => p.id === sourceId);
      const tgtIdx = arr.findIndex((p) => p.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const spliced = arr.splice(srcIdx, 1);
      const removed = spliced[0];
      if (!removed) return prev;
      arr.splice(tgtIdx, 0, removed);
      return arr;
    });
    setDragOverId(null);
    dragItemId.current = null;
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    dragItemId.current = null;
  };

  const statusIcon = (status: PhotoItem['status']) => {
    switch (status) {
      case 'uploading': return (
        <div className="w-5 h-5 border-2 border-white border-t-primary-400 rounded-full animate-spin" />
      );
      case 'checking': return (
        <div className="w-5 h-5 border-2 border-white border-t-secondary-400 rounded-full animate-spin" />
      );
      case 'approved': return <span className="text-green-400 text-lg">✓</span>;
      case 'rejected': return <span className="text-red-400 text-lg">✗</span>;
    }
  };

  const statusLabel = (photo: PhotoItem) => {
    switch (photo.status) {
      case 'uploading': return 'Uploading...';
      case 'checking': return 'Checking face...';
      case 'approved': return 'Verified';
      case 'rejected': return photo.error ?? 'Rejected';
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Add your photos</h1>
      <p className="text-foreground/60 mb-2 text-sm">
        Add {MIN_PHOTOS}–{MAX_PHOTOS} photos to your profile
      </p>
      <p className="text-sm text-primary-500 font-medium mb-6">
        {approvedCount} of {MIN_PHOTOS} required approved
      </p>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            draggable
            onDragStart={(e) => handleDragStart(e, photo.id)}
            onDragOver={(e) => handleDragOver(e, photo.id)}
            onDrop={(e) => handleDrop(e, photo.id)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${
              dragOverId === photo.id ? 'opacity-50 ring-2 ring-primary-500' : ''
            }`}
          >
            <img
              src={photo.localUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
            {/* Status overlay */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${
              photo.status === 'approved' ? 'bg-black/20' : 'bg-black/50'
            }`}>
              <div className="mb-1">{statusIcon(photo.status)}</div>
              <p className={`text-xs text-center px-1 leading-tight ${
                photo.status === 'approved' ? 'text-green-200' :
                photo.status === 'rejected' ? 'text-red-200' : 'text-white'
              }`}>
                {statusLabel(photo)}
              </p>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80 transition-colors z-10"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add photo slot */}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-primary-200 flex flex-col items-center justify-center gap-1 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <span className="text-2xl text-primary-300">+</span>
            <span className="text-xs text-primary-400">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <p className="text-xs text-foreground/40 mb-6 text-center">
        Drag to reorder · Your first photo will be your main photo
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {canContinue ? 'Continue' : `Add ${MIN_PHOTOS - approvedCount} more photo${MIN_PHOTOS - approvedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
