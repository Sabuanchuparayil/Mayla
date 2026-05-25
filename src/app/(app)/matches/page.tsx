'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MatchUser {
  id: string;
  name: string;
  age: number;
  primaryPhotoUrl: string;
  isVerified: boolean;
}

interface MatchItem {
  matchId: string;
  user: MatchUser;
  matchedAt: string;
}

interface Message {
  _id: string;
  senderId: string;
  content: string | null;
  type: string;
  createdAt: string;
}

interface MatchWithPreview extends MatchItem {
  lastMessage?: Message | null;
  unreadCount?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function daysLeft(matchedAt: string): number {
  const diff = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(matchedAt).getTime());
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function isRecent(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AvatarWithRing({
  src,
  alt,
  size = 56,
  ring = false,
}: {
  src: string;
  alt: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div
      className={`relative rounded-full flex-shrink-0 ${ring ? 'ring-2 ring-green-400 ring-offset-1' : ''}`}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-200">
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/matches');
        if (!res.ok) throw new Error('failed');
        const data = await res.json() as { matches?: MatchItem[] };
        const items: MatchItem[] = data.matches ?? [];

        // Batch fetch last messages in parallel
        const withPreviews: MatchWithPreview[] = await Promise.all(
          items.map(async (m) => {
            try {
              const msgRes = await fetch(`/api/messages/${m.matchId}?limit=1`);
              if (msgRes.ok) {
                const msgData = await msgRes.json() as { messages?: Message[] };
                const msgs = msgData.messages ?? [];
                return { ...m, lastMessage: msgs[0] ?? null };
              }
            } catch {
              // ignore
            }
            return { ...m, lastMessage: null };
          })
        );

        setMatches(withPreviews);
      } catch {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const newMatches = matches.filter(
    (m) => isRecent(m.matchedAt) || !m.lastMessage
  );
  const conversations = matches.filter((m) => m.lastMessage);

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Matches</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-[#E85D75] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* New Matches Section */}
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              New Matches
            </h2>
            {newMatches.length === 0 ? (
              <p className="text-gray-400 text-sm py-2">No new matches yet — keep swiping!</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {newMatches.map((m) => {
                  const days = daysLeft(m.matchedAt);
                  return (
                    <button
                      key={m.matchId}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 active:opacity-70 transition-opacity"
                      onClick={() => router.push(`/chat/${m.matchId}`)}
                    >
                      <AvatarWithRing
                        src={m.user.primaryPhotoUrl}
                        alt={m.user.name}
                        size={64}
                        ring={isRecent(m.matchedAt)}
                      />
                      <span className="text-xs font-medium text-gray-800 max-w-[64px] truncate">
                        {m.user.name}
                      </span>
                      {days <= 7 && days > 0 && !m.lastMessage && (
                        <span className="text-[10px] text-[#E85D75] font-semibold">
                          {days}d left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mx-4" />

          {/* Messages Section */}
          <div className="px-4 pt-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Messages
            </h2>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No messages yet</p>
                <p className="text-gray-400 text-sm">Start a conversation with your matches!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {conversations.map((m) => {
                  const msg = m.lastMessage;
                  const preview =
                    msg?.type === 'disappearing'
                      ? '📷 Photo'
                      : msg?.type === 'image'
                      ? '🖼 Image'
                      : msg?.content ?? '';
                  return (
                    <li key={m.matchId}>
                      <button
                        className="w-full flex items-center gap-3 py-3 active:bg-gray-50 transition-colors text-left"
                        onClick={() => router.push(`/chat/${m.matchId}`)}
                      >
                        <AvatarWithRing
                          src={m.user.primaryPhotoUrl}
                          alt={m.user.name}
                          size={52}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-gray-900 text-sm truncate">
                              {m.user.name}
                              {m.user.isVerified && (
                                <span className="ml-1 text-[#6C63FF] text-xs">✓</span>
                              )}
                            </span>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {msg ? formatTime(msg.createdAt) : timeAgo(m.matchedAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate mt-0.5">{preview}</p>
                        </div>
                        {(m.unreadCount ?? 0) > 0 && (
                          <span className="bg-[#E85D75] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                            {(m.unreadCount ?? 0) > 99 ? '99+' : m.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
