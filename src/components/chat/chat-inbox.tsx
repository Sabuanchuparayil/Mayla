'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatRowSkeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api/client';
import { useSocket } from '@/hooks/use-socket';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';
import { BlockReportModal } from '@/components/safety/block-report-modal';
import { VerifiedBadge } from '@/components/ui/verified-badge';

type Match = {
  id: string;
  status: string;
  otherUser: { id: string; displayName: string; verified: boolean };
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
};

type Message = {
  id: string;
  matchId?: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
};

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatPanel({
  matchId,
  otherUser,
  onBack,
  onUnmatched,
  fullScreen,
}: {
  matchId: string;
  otherUser: { id: string; displayName: string; verified?: boolean };
  onBack?: () => void;
  onUnmatched?: () => void;
  fullScreen?: boolean;
}) {
  const { t } = useLocale();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState('');
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [ladiesFirstHint, setLadiesFirstHint] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const pendingTextRef = useRef('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch<{ user: { id: string } }>('/api/auth/me').then((r) => {
      if (r.success) setMyId(r.data.user.id);
    });
    apiFetch<{ messages: Message[] }>(`/api/matches/${matchId}/messages`).then((r) => {
      if (r.success) setMessages(r.data.messages);
    });
    apiFetch<{ icebreakers: string[] }>(`/api/matches/${matchId}/icebreakers`).then((r) => {
      if (r.success) setIcebreakers(r.data.icebreakers);
    });
    apiFetch<{ profile: { locale?: string } | null }>('/api/users/me/profile').then((r) => {
      if (r.success && r.data.profile?.locale) setLocale(r.data.profile.locale);
    });
    apiFetch<{ canSendMessage: boolean; ladiesFirstHint: string | null }>(`/api/matches/${matchId}`).then(
      (r) => {
        if (r.success) {
          setCanSendMessage(r.data.canSendMessage);
          setLadiesFirstHint(r.data.ladiesFirstHint);
        }
      },
    );
    fetch(`/api/matches/${matchId}/messages`, { method: 'PATCH', credentials: 'include' });
  }, [matchId]);

  async function translateMessage(messageId: string, content: string) {
    const result = await apiFetch<{ translated: string }>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: content, targetLang: locale }),
    });
    if (result.success) {
      setTranslations((prev) => ({ ...prev, [messageId]: result.data.translated }));
    }
  }

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:match', matchId);
    const onMessage = (msg: Message & { matchId?: string }) => {
      if (!msg.matchId || msg.matchId === matchId) {
        setMessages((prev) => [...prev, msg]);
        if (msg.senderId === myId) {
          pendingTextRef.current = '';
        } else {
          setCanSendMessage(true);
          setLadiesFirstHint(null);
          setSendError('');
          setOtherTyping(false);
        }
      }
    };
    const onError = (err: { message?: string }) => {
      if (err.message) {
        setSendError(err.message);
        setText((prev) => prev || pendingTextRef.current);
      }
    };
    const onTyping = (payload: { matchId?: string; userId: string; typing: boolean }) => {
      if (payload.matchId === matchId && payload.userId !== myId) {
        setOtherTyping(payload.typing);
      }
    };
    const onRead = (payload: { matchId?: string; readerId: string }) => {
      if (payload.matchId === matchId && payload.readerId !== myId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === myId ? { ...m, readAt: m.readAt ?? new Date().toISOString() } : m)),
        );
      }
    };
    socket.on('message:new', onMessage);
    socket.on('error', onError);
    socket.on('typing:update', onTyping);
    socket.on('messages:read', onRead);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('error', onError);
      socket.off('typing:update', onTyping);
      socket.off('messages:read', onRead);
      socket.emit('leave:match', matchId);
    };
  }, [socket, matchId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  function emitTyping(typing: boolean) {
    if (!socket) return;
    if (typing) socket.emit('typing:start', matchId);
    else socket.emit('typing:stop', matchId);
  }

  function handleTextChange(value: string) {
    setText(value);
    if (sendError) setSendError('');
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1500);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !socket || !canSendMessage) return;
    const content = text.trim();
    pendingTextRef.current = content;
    setSendError('');
    emitTyping(false);
    socket.emit('message:send', { matchId, content });
    setText('');
  }

  async function unmatch() {
    if (!confirm(`Unmatch with ${otherUser.displayName}?`)) return;
    const result = await apiFetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'unmatch' }),
    });
    if (result.success) {
      onUnmatched?.();
    }
  }

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden p-0',
        fullScreen ? 'h-[calc(100dvh-8rem)] md:h-[calc(100vh-12rem)]' : 'h-[500px] md:h-[calc(100vh-14rem)]',
      )}
    >
      <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations"
              className="rounded-lg p-1 text-muted-foreground hover:bg-warm-200/50 md:hidden"
            >
              ←
            </button>
          ) : null}
          <div>
            <p className="text-sm font-semibold">{otherUser.displayName}</p>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-warm-400 animate-pulse')} />
              <span className="text-xs text-muted-foreground">
                {otherTyping ? 'Typing…' : connected ? 'Connected' : 'Connecting…'}
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu((s) => !s)}
            aria-label="Chat options"
            className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-warm-200/50"
          >
            ···
          </button>
          {showMenu ? (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-card-border bg-card py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm hover:bg-warm-200/30"
                onClick={() => {
                  setShowMenu(false);
                  setShowBlockReport(true);
                }}
              >
                Report
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setShowMenu(false);
                  void unmatch();
                }}
              >
                Unmatch
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!canSendMessage && ladiesFirstHint ? (
        <div className="border-b border-amber-200/50 bg-amber-50 px-5 py-2.5 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-300">
          🔒 {ladiesFirstHint}
        </div>
      ) : null}

      {sendError ? (
        <div className="border-b border-red-200/50 bg-red-50 px-5 py-2.5 text-sm text-red-600 dark:border-red-800/30 dark:bg-red-950/30">
          {sendError}
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <HeartIcon className="h-8 w-8 text-primary/20" />
            <p className="text-sm text-muted-foreground/60">{t('chatEmptyHint')}</p>
            {icebreakers.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 px-4">
                {icebreakers.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => setText(line)}
                    className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 active:scale-95"
                  >
                    {line}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn('flex flex-col', m.senderId === myId ? 'items-end' : 'items-start')}
          >
            <div
              className={cn(
                'max-w-[80%] animate-fade-up rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.senderId === myId
                  ? 'rounded-br-md bg-gradient-to-r from-primary-500 to-primary-400 text-white'
                  : 'rounded-bl-md bg-warm-200/60 text-foreground dark:bg-warm-400/10',
              )}
            >
              {m.content}
              {translations[m.id] ? (
                <p className="mt-1 border-t border-white/20 pt-1 text-xs opacity-80">{translations[m.id]}</p>
              ) : null}
              {m.senderId !== myId && !translations[m.id] ? (
                <button
                  type="button"
                  onClick={() => void translateMessage(m.id, m.content)}
                  className="mt-1 block text-[10px] underline opacity-70"
                >
                  Translate
                </button>
              ) : null}
            </div>
            {m.senderId === myId ? (
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {m.readAt ? 'Read' : 'Sent'}
              </span>
            ) : null}
          </div>
        ))}
        {otherTyping ? (
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-warm-200/60 px-4 py-2.5 text-sm text-muted-foreground dark:bg-warm-400/10">
            ···
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-card-border p-4 safe-area-pb">
        <Input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={
            !connected
              ? t('chatConnecting')
              : !canSendMessage
                ? t('chatLadiesFirst')
                : t('chatPlaceholder')
          }
          disabled={!connected || !canSendMessage}
          className="flex-1"
        />
        <Button type="submit" disabled={!connected || !canSendMessage} size="sm" aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </Button>
      </form>

      <BlockReportModal
        userId={otherUser.id}
        displayName={otherUser.displayName}
        open={showBlockReport}
        onClose={() => setShowBlockReport(false)}
        onBlocked={() => {
          setShowBlockReport(false);
          onUnmatched?.();
        }}
      />
    </Card>
  );
}

export function ChatInbox() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ matches: Match[] }>('/api/matches').then((r) => {
      setLoading(false);
      if (r.success) {
        const accepted = r.data.matches.filter((m) => m.status === 'ACCEPTED');
        setMatches(accepted);
      }
    });
  }, []);

  const selectedMatch = matches.find((m) => m.id === selected);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <ChatRowSkeleton />
          <ChatRowSkeleton />
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
          <HeartIcon className="h-7 w-7 text-primary/30" />
        </div>
        <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-foreground/70">
          No conversations yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Like profiles on Discover to start chatting
        </p>
        <Button href="/discover" className="mt-5" variant="glow">
          <HeartIcon className="h-4 w-4" />
          Go to Discover
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <ul className={cn('space-y-2', selected && 'hidden lg:block')}>
        {matches.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelected(m.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 active:scale-[0.98]',
                selected === m.id
                  ? 'border-primary/20 bg-primary/5 shadow-sm'
                  : 'border-card-border bg-card hover:bg-primary/3 hover:border-primary/10',
              )}
            >
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40">
                <span className="text-sm font-semibold text-primary">
                  {m.otherUser.displayName[0]}
                </span>
                {(m.unreadCount ?? 0) > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {m.unreadCount}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{m.otherUser.displayName}</p>
                  {m.lastMessageAt ? (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatMessageTime(m.lastMessageAt)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {m.lastMessage ? (
                    <p className="truncate text-xs text-muted-foreground">{m.lastMessage}</p>
                  ) : m.otherUser.verified ? (
                    <VerifiedBadge size="sm" className="scale-90 origin-left" />
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {selectedMatch ? (
        <ChatPanel
          matchId={selectedMatch.id}
          otherUser={selectedMatch.otherUser}
          fullScreen
          onBack={() => setSelected(null)}
          onUnmatched={() => {
            setMatches((prev) => prev.filter((m) => m.id !== selected));
            setSelected(null);
          }}
        />
      ) : (
        <div className="hidden items-center justify-center rounded-2xl border border-dashed border-card-border p-12 text-center text-sm text-muted-foreground lg:flex">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
}
