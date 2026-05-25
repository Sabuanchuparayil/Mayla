import type { Server, Socket } from 'socket.io';
import { connectMongoDB } from '@/lib/mongodb';
import { Message } from '@/models/message.model';
import { filterText } from '@/lib/content-filter';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';

const PRESENCE_TTL = 300; // 5 minutes

function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

function presenceKey(userId: string) {
  return `presence:${userId}`;
}

async function assertMatchMember(userId: string, matchId: string): Promise<boolean> {
  const match = await db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  return !!match;
}

export function registerChatHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  // ─── Join rooms for all active matches ────────────────────────────────────
  (async () => {
    try {
      const matches = await db.match.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      for (const m of matches) {
        await socket.join(matchRoom(m.id));
      }
    } catch {
      // non-fatal
    }
  })();

  // ─── Presence: mark online ─────────────────────────────────────────────────
  (async () => {
    await redis.setex(presenceKey(userId), PRESENCE_TTL, JSON.stringify({ status: 'online', lastSeen: new Date() }));
    socket.broadcast.emit('presence:update', { userId, status: 'online' });
  })();

  // ─── chat:message ──────────────────────────────────────────────────────────
  socket.on('chat:message', async (data: { matchId: string; content: string; type?: string }) => {
    try {
      if (!data.matchId || typeof data.content !== 'string' || !data.content.trim()) return;
      if (data.content.length > 1000) return;

      const isMember = await assertMatchMember(userId, data.matchId);
      if (!isMember) return;

      if (data.type !== 'image' && data.type !== 'disappearing') {
        const { clean } = filterText(data.content);
        if (!clean) {
          socket.emit('chat:error', { matchId: data.matchId, reason: 'prohibited_content' });
          return;
        }
      }

      await connectMongoDB();
      const type = (data.type ?? 'text') as 'text' | 'image' | 'disappearing';
      const message = await Message.create({
        matchId: data.matchId,
        senderId: userId,
        content: data.content.trim(),
        type,
      });
      const msg = message as import('@/models/message.model').IMessage;

      const payload = {
        id: (msg._id as object).toString(),
        matchId: data.matchId,
        senderId: userId,
        content: msg.content,
        type: msg.type,
        mediaUrl: msg.mediaUrl,
        disappearingMediaId: msg.disappearingMediaId,
        createdAt: msg.createdAt,
      };

      io.to(matchRoom(data.matchId)).emit('chat:message', payload);
    } catch {
      socket.emit('chat:error', { matchId: data.matchId, reason: 'server_error' });
    }
  });

  // ─── chat:typing ───────────────────────────────────────────────────────────
  socket.on('chat:typing', async (data: { matchId: string; isTyping: boolean }) => {
    if (!data.matchId) return;
    const isMember = await assertMatchMember(userId, data.matchId);
    if (!isMember) return;

    socket.to(matchRoom(data.matchId)).emit('chat:typing', {
      matchId: data.matchId,
      userId,
      isTyping: !!data.isTyping,
    });
  });

  // ─── message:read ──────────────────────────────────────────────────────────
  socket.on('message:read', async (data: { matchId: string; messageId: string }) => {
    try {
      if (!data.matchId || !data.messageId) return;
      const isMember = await assertMatchMember(userId, data.matchId);
      if (!isMember) return;

      await connectMongoDB();
      await Message.updateOne(
        { _id: data.messageId, matchId: data.matchId, senderId: { $ne: userId } },
        { $set: { readAt: new Date() } },
      );

      socket.to(matchRoom(data.matchId)).emit('message:read', {
        matchId: data.matchId,
        messageId: data.messageId,
        readAt: new Date(),
      });
    } catch {
      // non-fatal
    }
  });

  // ─── presence:update ──────────────────────────────────────────────────────
  socket.on('presence:update', async (data: { status: 'online' | 'away' }) => {
    const status = data.status === 'away' ? 'away' : 'online';
    await redis.setex(presenceKey(userId), PRESENCE_TTL, JSON.stringify({ status, lastSeen: new Date() }));
    socket.broadcast.emit('presence:update', { userId, status });
  });

  // ─── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    const lastSeen = new Date();
    await redis.setex(
      presenceKey(userId),
      60 * 60 * 24, // keep last-seen for 24h after disconnect
      JSON.stringify({ status: 'offline', lastSeen }),
    );
    socket.broadcast.emit('presence:update', { userId, status: 'offline', lastSeen });
  });
}
