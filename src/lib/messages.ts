import { connectMongoDB } from '@/lib/mongodb';
import { Message } from '@/models/message.model';

export type ChatMessage = {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

export async function listMatchMessages(
  matchId: string,
  limit = 50,
  before?: string,
): Promise<ChatMessage[]> {
  await connectMongoDB();

  const query: Record<string, unknown> = { matchId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages
    .reverse()
    .map((m) => ({
      id: String(m._id),
      matchId: m.matchId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    }));
}

export async function markMessagesRead(matchId: string, readerId: string) {
  await connectMongoDB();
  await Message.updateMany(
    { matchId, senderId: { $ne: readerId }, readAt: null },
    { $set: { readAt: new Date() } },
  );
}

export async function countUnreadMessages(userId: string, matchIds: string[]): Promise<number> {
  if (matchIds.length === 0) return 0;
  await connectMongoDB();
  return Message.countDocuments({
    matchId: { $in: matchIds },
    senderId: { $ne: userId },
    readAt: null,
  });
}

export type MatchInboxPreview = {
  matchId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export async function getMatchInboxPreviews(
  userId: string,
  matchIds: string[],
): Promise<Record<string, MatchInboxPreview>> {
  if (matchIds.length === 0) return {};
  await connectMongoDB();

  const previews: Record<string, MatchInboxPreview> = {};
  await Promise.all(
    matchIds.map(async (matchId) => {
      const [last, unreadCount] = await Promise.all([
        Message.findOne({ matchId }).sort({ createdAt: -1 }).lean(),
        Message.countDocuments({ matchId, senderId: { $ne: userId }, readAt: null }),
      ]);
      previews[matchId] = {
        matchId,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.createdAt?.toISOString() ?? null,
        unreadCount,
      };
    }),
  );
  return previews;
}
