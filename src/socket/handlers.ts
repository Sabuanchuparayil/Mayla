import type { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { connectMongoDB } from '@/lib/mongodb';
import { userCanAccessMatch, getMatchForUser } from '@/lib/matches';
import { Message } from '@/models/message.model';
import { db } from '@/lib/db';
import { recordMessageSent, recordMessageReply, scheduleGentlemanScoreRefresh } from '@/lib/gentleman-score';
import { sendPushToUser } from '@/lib/push';

async function authenticateSocket(socket: Socket): Promise<string | null> {
  const token =
    (socket.handshake.auth?.token as string | undefined) ??
    (socket.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);

  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function registerSocketHandlers(io: Server): void {
  io.use(async (socket, next) => {
    const userId = await authenticateSocket(socket);
    if (!userId) {
      next(new Error('Unauthorized'));
      return;
    }
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('join:match', async (matchId: string) => {
      if (await userCanAccessMatch(matchId, userId)) {
        socket.join(`match:${matchId}`);
      }
    });

    socket.on('leave:match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on('typing:start', async (matchId: string) => {
      if (await userCanAccessMatch(matchId, userId)) {
        socket.to(`match:${matchId}`).emit('typing:update', { matchId, userId, typing: true });
      }
    });

    socket.on('typing:stop', async (matchId: string) => {
      if (await userCanAccessMatch(matchId, userId)) {
        socket.to(`match:${matchId}`).emit('typing:update', { matchId, userId, typing: false });
      }
    });

    socket.on('message:send', async (payload: { matchId: string; content: string }) => {
      try {
        if (!(await userCanAccessMatch(payload.matchId, userId))) {
          socket.emit('error', { message: 'Not allowed in this match' });
          return;
        }

        const match = await getMatchForUser(payload.matchId, userId);
        if (match) {
          const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
          const otherProfile = await db.profile.findUnique({ where: { userId: otherUserId } });
          if (otherProfile?.ladiesFirstMessaging && otherProfile.gender === 'FEMALE') {
            const priorFromOther = await Message.findOne({
              matchId: payload.matchId,
              senderId: otherUserId,
            });
            const senderProfile = await db.profile.findUnique({ where: { userId } });
            if (!priorFromOther && senderProfile?.gender === 'MALE') {
              socket.emit('error', { message: 'She prefers to message first' });
              return;
            }
          }
        }

        await connectMongoDB();

        const priorMessage = await Message.findOne({
          matchId: payload.matchId,
          senderId: { $ne: userId },
        }).sort({ createdAt: -1 });

        const message = await Message.create({
          matchId: payload.matchId,
          senderId: userId,
          content: payload.content.slice(0, 5000),
        });

        await recordMessageSent(userId, payload.content.length);
        scheduleGentlemanScoreRefresh(userId);

        if (match) {
          const otherUserId = match.userAId === userId ? match.userBId : match.userAId;
          if (priorMessage) {
            const replyDelayMs = Date.now() - new Date(priorMessage.createdAt).getTime();
            await recordMessageReply(priorMessage.senderId, replyDelayMs);
            scheduleGentlemanScoreRefresh(priorMessage.senderId);
          }
          const senderProfile = await db.profile.findUnique({
            where: { userId },
            select: { displayName: true },
          });
          void sendPushToUser(otherUserId, {
            title: 'New message',
            body: `${senderProfile?.displayName ?? 'Someone'} sent you a message`,
            url: `/chat?match=${payload.matchId}`,
          });
        }

        io.to(`match:${payload.matchId}`).emit('message:new', {
          id: message._id.toString(),
          matchId: message.matchId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        });
        socket.to(`match:${payload.matchId}`).emit('typing:update', { matchId: payload.matchId, userId, typing: false });
      } catch (error) {
        console.error('[Socket] message:send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('presence:online', () => {
      socket.broadcast.emit('presence:update', { userId, status: 'online' });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:update', { userId, status: 'offline' });
    });
  });
}
