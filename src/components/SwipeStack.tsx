'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileCard from './ProfileCard';
import ProfileModal from './ProfileModal';
import Image from 'next/image';
import { track } from '@/lib/analytics';

interface DiscoveryProfile {
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

interface MatchData {
  matched: boolean;
  matchId?: string;
  targetProfile?: DiscoveryProfile;
}

const SWIPE_THRESHOLD = 100;
const SUPER_LIKE_THRESHOLD = 120;

// UI action → API SwipeAction enum
const ACTION_MAP = {
  like: 'LIKE',
  pass: 'DISLIKE',
  superlike: 'SUPER_LIKE',
} as const;

type UiAction = keyof typeof ACTION_MAP;

export default function SwipeStack() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
  }>({ isDragging: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 });

  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [modalProfile, setModalProfile] = useState<DiscoveryProfile | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const didPointerMove = useRef(false);

  useEffect(() => {
    fetch('/api/discovery/stack')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: unknown) => {
        const profiles = Array.isArray(data) ? data : (data as { profiles?: DiscoveryProfile[] }).profiles ?? [];
        setProfiles(profiles as DiscoveryProfile[]);
      })
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const postSwipe = useCallback(async (profile: DiscoveryProfile, action: UiAction) => {
    try {
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: profile.userId, action: ACTION_MAP[action] }),
      });
      if (res.status === 429) {
        setLimitReached(true);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as MatchData;
        track('swipe', { action });
        if (data.matched) {
          track('match_created');
          setMatchData({ matched: true, matchId: data.matchId, targetProfile: profile });
        }
      }
    } catch {
      // Swipe silently fails
    }
  }, []);

  const advanceCard = useCallback(
    (action: UiAction) => {
      const profile = profiles[currentIndex];
      if (!profile) return;
      void postSwipe(profile, action);
      setCurrentIndex((i) => i + 1);
      setSwipeDir(null);
      setDragState({ isDragging: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 });
    },
    [profiles, currentIndex, postSwipe]
  );

  const openChat = useCallback(() => {
    const matchId = matchData?.matchId;
    setMatchData(null);
    if (matchId) router.push(`/chat/${matchId}`);
  }, [matchData, router]);

  // Pointer event handlers
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modalProfile) return;
    didPointerMove.current = false;
    cardRef.current?.setPointerCapture(e.pointerId);
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      deltaX: 0,
      deltaY: 0,
    });
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.isDragging) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didPointerMove.current = true;
    }
    setDragState((s) => ({ ...s, deltaX: dx, deltaY: dy }));
    if (dx > 30) setSwipeDir('right');
    else if (dx < -30) setSwipeDir('left');
    else if (dy < -30) setSwipeDir('up');
    else setSwipeDir(null);
  };

  const onPointerUp = () => {
    if (!dragState.isDragging) return;
    const { deltaX, deltaY } = dragState;

    if (!didPointerMove.current) {
      // Treat as click — open modal
      const profile = profiles[currentIndex];
      if (profile) setModalProfile(profile);
      setDragState({ isDragging: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 });
      setSwipeDir(null);
      return;
    }

    if (deltaY < -SUPER_LIKE_THRESHOLD && Math.abs(deltaX) < Math.abs(deltaY)) {
      advanceCard('superlike');
    } else if (deltaX > SWIPE_THRESHOLD) {
      advanceCard('like');
    } else if (deltaX < -SWIPE_THRESHOLD) {
      advanceCard('pass');
    } else {
      // Snap back
      setDragState({ isDragging: false, startX: 0, startY: 0, deltaX: 0, deltaY: 0 });
      setSwipeDir(null);
    }
  };

  const topProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const cardTransform = dragState.isDragging
    ? `translateX(${dragState.deltaX}px) translateY(${dragState.deltaY * 0.3}px) rotate(${dragState.deltaX * 0.05}deg)`
    : 'translateX(0) translateY(0) rotate(0deg)';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Card stack */}
      <div className="relative flex-1 mx-4 mt-4" style={{ minHeight: 0 }}>
        {!topProfile ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M21 8.5C21 13.75 12 21 12 21S3 13.75 3 8.5a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="8.5" r="3" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-lg">No more profiles</p>
            <p className="text-gray-400 text-sm">Check back later for new people near you</p>
          </div>
        ) : (
          <>
            {/* Second card (behind) */}
            {nextProfile && (
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{
                  transform: 'scale(0.95) translateY(8px)',
                  zIndex: 1,
                }}
              >
                <ProfileCard profile={nextProfile} />
              </div>
            )}

            {/* Top card */}
            <div
              ref={cardRef}
              className="absolute inset-0 touch-none"
              style={{
                transform: cardTransform,
                transition: dragState.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: 2,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <ProfileCard profile={topProfile} />

              {/* LIKE stamp */}
              {swipeDir === 'right' && (
                <div
                  className="absolute top-10 left-6 border-4 border-green-500 text-green-500 text-3xl font-black px-3 py-1 rounded-lg rotate-[-20deg]"
                  style={{ opacity: Math.min(1, Math.abs(dragState.deltaX) / 80) }}
                >
                  LIKE
                </div>
              )}

              {/* NOPE stamp */}
              {swipeDir === 'left' && (
                <div
                  className="absolute top-10 right-6 border-4 border-red-500 text-red-500 text-3xl font-black px-3 py-1 rounded-lg rotate-[20deg]"
                  style={{ opacity: Math.min(1, Math.abs(dragState.deltaX) / 80) }}
                >
                  NOPE
                </div>
              )}

              {/* SUPER stamp */}
              {swipeDir === 'up' && (
                <div
                  className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-secondary-500 text-secondary-500 text-2xl font-black px-3 py-1 rounded-lg"
                  style={{ opacity: Math.min(1, Math.abs(dragState.deltaY) / 80) }}
                >
                  SUPER
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action buttons */}
      {topProfile && (
        <div className="flex items-center justify-center gap-5 py-5">
          {/* Pass */}
          <button
            onClick={() => advanceCard('pass')}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 active:scale-90 transition-transform border border-gray-100"
            aria-label="Pass"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Super Like */}
          <button
            onClick={() => advanceCard('superlike')}
            className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-secondary-500 active:scale-90 transition-transform border border-gray-100 relative"
            aria-label="Super Like"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-[8px] font-bold rounded-full px-1">GOLD</span>
          </button>

          {/* Like */}
          <button
            onClick={() => advanceCard('like')}
            className="w-14 h-14 bg-primary-500 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Like"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Profile modal */}
      {modalProfile && (
        <ProfileModal
          profile={modalProfile}
          onClose={() => setModalProfile(null)}
          onLike={() => {
            advanceCard('like');
            setModalProfile(null);
          }}
        />
      )}

      {/* Match modal */}
      {matchData?.matched && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-primary-500 to-secondary-500 text-white p-8">
          <h1 className="text-4xl font-black mb-2">It&apos;s a Match!</h1>
          <p className="text-white/80 mb-8">
            You and {matchData.targetProfile?.name ?? 'someone'} liked each other
          </p>

          <div className="relative mb-10">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl relative">
              <Image
                src={matchData.targetProfile?.primaryPhotoUrl ?? ''}
                alt={matchData.targetProfile?.name ?? 'Your match'}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#E85D75">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>

          <button
            className="w-full max-w-xs bg-white text-primary-500 font-bold py-3 rounded-2xl mb-3 active:scale-95 transition-transform"
            onClick={openChat}
          >
            Send a message
          </button>
          <button
            className="w-full max-w-xs bg-white/20 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
            onClick={() => setMatchData(null)}
          >
            Keep swiping
          </button>
        </div>
      )}

      {/* Daily limit reached — upgrade prompt */}
      {limitReached && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">You&apos;re out of likes for today</h2>
            <p className="text-gray-500 text-sm mb-6">
              Upgrade to Gold for more likes every day, plus Super Likes and more.
            </p>
            <button
              className="w-full bg-primary-500 text-white font-semibold py-3 rounded-2xl mb-2 active:scale-95 transition-transform"
              onClick={() => {
                track('upgrade_clicked', { source: 'swipe_limit' });
                router.push('/settings/subscription');
              }}
            >
              Upgrade to Gold
            </button>
            <button
              className="w-full text-gray-500 font-medium py-2"
              onClick={() => setLimitReached(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
