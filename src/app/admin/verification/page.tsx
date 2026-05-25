'use client';

import { useState, useEffect, useCallback } from 'react';

interface VerificationItem {
  id: string;
  userId: string;
  status: string;
  selfieUrl: string | null;
  user: {
    id: string;
    createdAt: string;
    profile: { name: string; birthDate: string } | null;
    photos: { id: string; url: string; order: number }[];
  };
}

interface VerificationResponse {
  items: VerificationItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function AdminVerificationPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, Set<string>>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verification-queue?page=${page}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as VerificationResponse;
      setData(json);
      // Initialize all photos as selected by default
      const initialSelections: Record<string, Set<string>> = {};
      json.items.forEach((item) => {
        initialSelections[item.id] = new Set(item.user.photos.map((p) => p.id));
      });
      setSelectedPhotos(initialSelections);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const togglePhoto = (itemId: string, photoId: string) => {
    setSelectedPhotos((prev) => {
      const current = new Set(prev[itemId] ?? []);
      if (current.has(photoId)) {
        current.delete(photoId);
      } else {
        current.add(photoId);
      }
      return { ...prev, [itemId]: current };
    });
  };

  const handleDecision = async (
    item: VerificationItem,
    decision: 'APPROVED' | 'REJECTED',
  ) => {
    setActionLoading(item.id + decision);
    try {
      const photoIds =
        decision === 'APPROVED'
          ? Array.from(selectedPhotos[item.id] ?? [])
          : undefined;
      const res = await fetch('/api/admin/verification-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: item.userId, decision, photoIds }),
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchItems();
    } catch {
      alert('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve user verifications</p>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <>
          {!data || data.items.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-500 text-sm">
              No pending verifications.
            </div>
          ) : (
            <div className="space-y-4">
              {data.items.map((item) => (
                <VerificationCard
                  key={item.id}
                  item={item}
                  selected={selectedPhotos[item.id] ?? new Set()}
                  onTogglePhoto={togglePhoto}
                  onDecision={handleDecision}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}

          {data && (data.page > 1 || data.hasMore) && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasMore}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VerificationCard({
  item,
  selected,
  onTogglePhoto,
  onDecision,
  actionLoading,
}: {
  item: VerificationItem;
  selected: Set<string>;
  onTogglePhoto: (itemId: string, photoId: string) => void;
  onDecision: (item: VerificationItem, decision: 'APPROVED' | 'REJECTED') => Promise<void>;
  actionLoading: string | null;
}) {
  const name = item.user.profile?.name ?? 'Unknown';
  const age = item.user.profile?.birthDate ? getAge(item.user.profile.birthDate) : null;
  const joined = new Date(item.user.createdAt).toLocaleDateString();
  const isApproving = actionLoading === item.id + 'APPROVED';
  const isRejecting = actionLoading === item.id + 'REJECTED';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Selfie */}
          <div className="flex-shrink-0">
            {item.selfieUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.selfieUrl}
                alt="selfie"
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">
              {name}
              {age !== null && (
                <span className="font-normal text-gray-500 ml-1">{age} yrs</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Joined {joined}</div>

            {/* Photos grid */}
            {item.user.photos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Select photos to approve:
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.user.photos
                    .sort((a, b) => a.order - b.order)
                    .map((photo) => {
                      const isChecked = selected.has(photo.id);
                      return (
                        <button
                          key={photo.id}
                          onClick={() => onTogglePhoto(item.id, photo.id)}
                          className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                            isChecked ? 'border-secondary-500' : 'border-gray-200'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt="profile photo"
                            className="w-16 h-16 object-cover"
                          />
                          {isChecked && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-secondary-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => void onDecision(item, 'APPROVED')}
            disabled={isApproving || isRejecting || selected.size === 0}
            className="px-4 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {isApproving ? 'Approving...' : `Approve (${selected.size})`}
          </button>
          <button
            onClick={() => void onDecision(item, 'REJECTED')}
            disabled={isApproving || isRejecting}
            className="px-4 py-1.5 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-50"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
