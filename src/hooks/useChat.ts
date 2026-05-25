'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

export interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  content: string | null;
  type: 'text' | 'image' | 'disappearing';
  mediaUrl: string | null;
  disappearingMediaId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

interface UseChatOptions {
  matchId: string;
  userId: string;
  accessToken: string;
}

interface PresencePayload {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

interface TypingPayload {
  matchId: string;
  userId: string;
  isTyping: boolean;
}

interface ReadPayload {
  messageId: string;
  readAt: string;
}

interface UseChatReturn {
  messages: Message[];
  isConnected: boolean;
  partnerIsTyping: boolean;
  partnerOnline: boolean;
  partnerLastSeen: Date | null;
  sendMessage: (content: string, type?: 'text' | 'image' | 'disappearing', mediaUrl?: string) => void;
  sendTyping: (isTyping: boolean) => void;
  markRead: (messageId: string) => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useChat({ matchId, userId, accessToken }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<Date | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMoreRef = useRef(false);

  // Initial message load
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch(`/api/messages/${matchId}?limit=50`);
        if (res.ok) {
          const data = await res.json() as { messages: Message[] };
          const msgs = data.messages ?? [];
          setMessages(msgs);
          if (msgs.length < 50) setHasMore(false);
        }
      } catch {
        // silently fail
      }
    }
    void loadInitial();
  }, [matchId]);

  // Socket.IO connection
  useEffect(() => {
    const socket = io('/', {
      path: '/socket.io',
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('presence:update', { matchId, online: true });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat:message', (msg: Message) => {
      if (msg.matchId !== matchId) return;
      setMessages((prev) => {
        // Replace optimistic message if same tempId, else append
        const exists = prev.some((m) => m._id === msg._id);
        if (exists) {
          return prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m));
        }
        // Remove any optimistic temp message with matching content
        return [...prev, msg];
      });
      // Auto mark read if message is from partner
      if (msg.senderId !== userId) {
        socket.emit('message:read', { messageId: msg._id, matchId });
      }
    });

    socket.on('chat:typing', (payload: TypingPayload) => {
      if (payload.matchId !== matchId) return;
      if (payload.userId !== userId) {
        setPartnerIsTyping(payload.isTyping);
      }
    });

    socket.on('message:read', (payload: ReadPayload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.messageId
            ? { ...m, readAt: new Date(payload.readAt) }
            : m
        )
      );
    });

    socket.on('presence:update', (payload: PresencePayload) => {
      if (payload.userId !== userId) {
        setPartnerOnline(payload.online);
        if (!payload.online && payload.lastSeen) {
          setPartnerLastSeen(new Date(payload.lastSeen));
        }
      }
    });

    socket.on('chat:error', (_err: unknown) => {
      // handle error silently
    });

    return () => {
      socket.emit('presence:update', { matchId, online: false });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId, userId, accessToken]);

  const sendMessage = useCallback(
    (content: string, type: 'text' | 'image' | 'disappearing' = 'text', mediaUrl?: string) => {
      const tempId = `temp_${Date.now()}`;
      const optimistic: Message = {
        _id: tempId,
        matchId,
        senderId: userId,
        content,
        type,
        mediaUrl: mediaUrl ?? null,
        disappearingMediaId: null,
        readAt: null,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, optimistic]);

      if (socketRef.current?.connected) {
        socketRef.current.emit('chat:message', {
          matchId,
          content,
          type,
          mediaUrl,
          tempId,
        });
      } else {
        // REST fallback
        fetch(`/api/messages/${matchId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, type, mediaUrl }),
        })
          .then((r) => r.json())
          .then((data: { message: Message }) => {
            setMessages((prev) =>
              prev.map((m) => (m._id === tempId ? data.message : m))
            );
          })
          .catch(() => {
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
          });
      }
    },
    [matchId, userId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('chat:typing', { matchId, isTyping });
      }, 500);
    },
    [matchId]
  );

  const markRead = useCallback(
    (messageId: string) => {
      socketRef.current?.emit('message:read', { messageId, matchId });
    },
    [matchId]
  );

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || messages.length === 0) return;
    loadingMoreRef.current = true;
    try {
      const oldest = messages[0];
      if (!oldest) return;
      const before = new Date(oldest.createdAt).toISOString();
      const res = await fetch(`/api/messages/${matchId}?before=${before}&limit=50`);
      if (res.ok) {
        const data = await res.json() as { messages: Message[] };
        const older = data.messages ?? [];
        if (older.length === 0 || older.length < 50) setHasMore(false);
        if (older.length > 0) {
          setMessages((prev) => [...older, ...prev]);
        }
      }
    } finally {
      loadingMoreRef.current = false;
    }
  }, [matchId, messages, hasMore]);

  return {
    messages,
    isConnected,
    partnerIsTyping,
    partnerOnline,
    partnerLastSeen,
    sendMessage,
    sendTyping,
    markRead,
    loadMore,
    hasMore,
  };
}
