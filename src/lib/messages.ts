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
