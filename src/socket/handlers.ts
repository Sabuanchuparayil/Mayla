import type { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { connectMongoDB } from '@/lib/mongodb';
import { userCanAccessMatch } from '@/lib/matches';
import { Message } from '@/models/message.model';

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

    socket.on('message:send', async (payload: { matchId: string; content: string }) => {
      try {
        if (!(await userCanAccessMatch(payload.matchId, userId))) {
          socket.emit('error', { message: 'Not allowed in this match' });
          return;
        }

        await connectMongoDB();
        const message = await Message.create({
          matchId: payload.matchId,
          senderId: userId,
          content: payload.content.slice(0, 5000),
        });

        io.to(`match:${payload.matchId}`).emit('message:new', {
          id: message._id.toString(),
          matchId: message.matchId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        });
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
