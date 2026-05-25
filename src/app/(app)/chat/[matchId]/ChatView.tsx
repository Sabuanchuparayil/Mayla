'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useChat, type Message } from '@/hooks/useChat';

interface MatchUser {
  id: string;
  name: string;
  age: number;
  primaryPhotoUrl: string;
  isVerified: boolean;
}

interface ChatViewProps {
  matchId: string;
  userId: string;
  accessToken: string;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

// ── Disappearing photo view ───────────────────────────────────────────────────
function DisappearingPhoto({
  mediaId,
  onViewed,
}: {
  mediaId: string;
  onViewed: () => void;
}) {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleView() {
    if (loading || viewUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/media/disappearing/${mediaId}/viewed`);
      if (res.ok) {
        const data = await res.json() as { viewUrl: string };
        setViewUrl(data.viewUrl);
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleClose() {
    setOpen(false);
    try {
      await fetch(`/api/media/disappearing/${mediaId}/viewed`, { method: 'PUT' });
    } finally {
      onViewed();
    }
  }

  return (
    <>
      <button
        onClick={handleView}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C63FF] text-white text-sm font-medium active:opacity-80 transition-opacity disabled:opacity-60"
      >
        <span>📷</span>
        <span>{loading ? 'Loading…' : 'View once photo'}</span>
      </button>

      {open && viewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          style={{ userSelect: 'none' }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white bg-black/60 rounded-full w-9 h-9 flex items-center justify-center text-xl z-10"
            aria-label="Close"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewUrl}
            alt="View once"
            className="max-w-full max-h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      )}
    </>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isMine,
  onImageClick,
  onDisappearingViewed,
}: {
  msg: Message;
  isMine: boolean;
  onImageClick: (url: string) => void;
  onDisappearingViewed: (id: string) => void;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col max-w-[75%] gap-1 ${isMine ? 'items-end self-end' : 'items-start self-start'}`}>
      {msg.type === 'text' && (
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-[#E85D75] text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {msg.content}
        </div>
      )}

      {msg.type === 'image' && msg.mediaUrl && (
        <button
          onClick={() => onImageClick(msg.mediaUrl!)}
          className="rounded-2xl overflow-hidden max-w-[220px] active:opacity-80 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={msg.mediaUrl}
            alt="Image"
            className="w-full h-auto object-cover"
          />
        </button>
      )}

      {msg.type === 'disappearing' && (
        <>
          {msg.readAt ? (
            <span className="text-sm text-gray-400 italic">Photo viewed 👁️</span>
          ) : msg.disappearingMediaId ? (
            <DisappearingPhoto
              mediaId={msg.disappearingMediaId}
              onViewed={() => onDisappearingViewed(msg._id)}
            />
          ) : null}
        </>
      )}

      <div className={`flex items-center gap-1 text-[10px] text-gray-400 ${isMine ? 'flex-row-reverse' : ''}`}>
        <span>{time}</span>
        {isMine && msg.readAt && (
          <span className="text-[#E85D75] text-[10px]">✓✓</span>
        )}
      </div>
    </div>
  );
}

// ── Main ChatView ─────────────────────────────────────────────────────────────
export default function ChatView({ matchId, userId, accessToken }: ChatViewProps) {
  const { messages, isConnected, partnerIsTyping, partnerOnline, partnerLastSeen, sendMessage, sendTyping, markRead, loadMore, hasMore } =
    useChat({ matchId, userId, accessToken });

  const [partnerInfo, setPartnerInfo] = useState<MatchUser | null>(null);
  const [text, setText] = useState('');
  const [disappearingMode, setDisappearingMode] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch partner info
  useEffect(() => {
    fetch('/api/matches')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { matches?: Array<{ matchId: string; user: MatchUser }> } | null) => {
        if (!data) return;
        const found = (data.matches ?? []).find((m) => m.matchId === matchId);
        if (found) setPartnerInfo(found.user);
      })
      .catch(() => null);
  }, [matchId]);

  // Mark incoming messages read
  useEffect(() => {
    messages.forEach((m) => {
      if (m.senderId !== userId && !m.readAt) {
        markRead(m._id);
      }
    });
  }, [messages, userId, markRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, partnerIsTyping]);

  // IntersectionObserver on top element for loadMore
  useEffect(() => {
    if (!hasMore) return;
    const el = topRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          await loadMore();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, isLoadingMore]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    sendMessage(content, 'text');
    setText('');
    sendTyping(false);
    textareaRef.current?.focus();
  }, [text, sendMessage, sendTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      sendTyping(e.target.value.length > 0);
      // Auto-resize
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
    },
    [sendTyping]
  );

  const handleBlur = useCallback(() => {
    sendTyping(false);
  }, [sendTyping]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const endpoint = disappearingMode ? '/api/media/disappearing' : '/api/media/upload';
        const res = await fetch(endpoint, { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json() as { url?: string; mediaUrl?: string; id?: string };
          if (disappearingMode) {
            sendMessage('', 'disappearing', data.url ?? data.mediaUrl);
          } else {
            sendMessage('', 'image', data.url ?? data.mediaUrl);
          }
        }
      } catch {
        // fail silently
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [disappearingMode, sendMessage]
  );

  const handleDisappearingViewed = useCallback((_id: string) => {
    // The message state will update via socket or we can trigger a UI refresh
  }, []);

  // Online status string
  function statusText() {
    if (partnerOnline) return 'Active now';
    if (partnerLastSeen) {
      const mins = Math.floor((Date.now() - partnerLastSeen.getTime()) / 60000);
      if (mins < 1) return 'Active just now';
      if (mins < 60) return `Active ${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `Active ${hrs}h ago`;
    }
    return '';
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white z-10 flex-shrink-0">
        <button
          onClick={() => window.history.back()}
          className="text-gray-500 active:text-gray-700 transition-colors mr-1"
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {partnerInfo ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <Image src={partnerInfo.primaryPhotoUrl} alt={partnerInfo.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {partnerInfo ? `${partnerInfo.name}, ${partnerInfo.age}` : 'Loading…'}
          </p>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${partnerOnline ? 'bg-green-400' : 'bg-gray-300'}`}
            />
            <span className="text-xs text-gray-400">{statusText()}</span>
          </div>
        </div>

        {!isConnected && (
          <span className="text-xs text-amber-500 flex-shrink-0">Reconnecting…</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        <div ref={topRef} className="h-1" />

        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-[#E85D75] rounded-full animate-spin" />
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isMine={msg.senderId === userId}
            onImageClick={setLightboxUrl}
            onDisappearingViewed={handleDisappearingViewed}
          />
        ))}

        {partnerIsTyping && (
          <div className="self-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Send bar */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-2 flex items-end gap-2">
        {/* Attachment button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 active:text-gray-600 transition-colors rounded-full"
          aria-label="Attach image"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        </button>

        {/* Disappearing mode toggle */}
        <button
          onClick={() => setDisappearingMode((v) => !v)}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            disappearingMode ? 'text-[#E85D75] bg-pink-50' : 'text-gray-400'
          }`}
          aria-label="Toggle disappearing mode"
          title={disappearingMode ? 'Disappearing on' : 'Disappearing off'}
        >
          🔥
        </button>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Message…"
          rows={1}
          className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#E85D75]/30 transition-all overflow-hidden"
          style={{ minHeight: '40px', maxHeight: '100px' }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex-shrink-0 w-9 h-9 bg-[#E85D75] rounded-full flex items-center justify-center text-white active:bg-[#d44d65] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/60 rounded-full w-9 h-9 flex items-center justify-center text-xl"
            aria-label="Close"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
