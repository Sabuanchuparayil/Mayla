'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/client';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

type Match = {
  id: string;
  status: string;
  otherUser: { id: string; displayName: string; verified: boolean };
};

type Message = {
  id: string;
  matchId?: string;
  senderId: string;
  content: string;
  createdAt: string;
};

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function ChatPanel({ matchId }: { matchId: string }) {
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ user: { id: string } }>('/api/auth/me').then((r) => {
      if (r.success) setMyId(r.data.user.id);
    });
    apiFetch<{ messages: Message[] }>(`/api/matches/${matchId}/messages`).then((r) => {
      if (r.success) setMessages(r.data.messages);
    });
    fetch(`/api/matches/${matchId}/messages`, { method: 'PATCH', credentials: 'include' });
  }, [matchId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join:match', matchId);
    const onMessage = (msg: Message & { matchId?: string }) => {
      if (!msg.matchId || msg.matchId === matchId) setMessages((prev) => [...prev, msg]);
    };
    socket.on('message:new', onMessage);
    return () => {
      socket.off('message:new', onMessage);
      socket.emit('leave:match', matchId);
    };
  }, [socket, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('message:send', { matchId, content: text.trim() });
    setText('');
  }

  return (
    <Card className="flex h-[500px] flex-col overflow-hidden p-0">
      {/* Connection indicator */}
      <div className="flex items-center gap-2 border-b border-card-border px-5 py-3">
        <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-warm-400 animate-pulse')} />
        <span className="text-xs text-muted-foreground">
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <HeartIcon className="h-8 w-8 text-primary/20" />
            <p className="mt-3 text-sm text-muted-foreground/60">
              Send the first message to break the ice
            </p>
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[80%] animate-fade-up rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              m.senderId === myId
                ? 'ml-auto rounded-br-md bg-gradient-to-r from-primary-500 to-primary-400 text-white'
                : 'rounded-bl-md bg-warm-200/60 text-foreground dark:bg-warm-400/10',
            )}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 border-t border-card-border p-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? 'Type something sweet...' : 'Connecting...'}
          disabled={!connected}
          className="flex-1"
        />
        <Button type="submit" disabled={!connected} size="sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </Button>
      </form>
    </Card>
  );
}

export function ChatInbox() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ matches: Match[] }>('/api/matches').then((r) => {
      if (r.success) {
        const accepted = r.data.matches.filter((m) => m.status === 'ACCEPTED');
        setMatches(accepted);
        if (accepted[0]) setSelected(accepted[0].id);
      }
    });
  }, []);

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
      <ul className="space-y-2">
        {matches.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setSelected(m.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300',
                selected === m.id
                  ? 'border-primary/20 bg-primary/5 shadow-sm'
                  : 'border-card-border bg-card hover:bg-primary/3 hover:border-primary/10',
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40">
                <span className="text-sm font-semibold text-primary">
                  {m.otherUser.displayName[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.otherUser.displayName}</p>
                {m.otherUser.verified ? (
                  <span className="text-xs text-emerald-500">Verified</span>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {selected ? <ChatPanel matchId={selected} /> : null}
    </div>
  );
}
