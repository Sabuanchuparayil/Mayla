import { db } from '@/lib/db';
import { connectMongoDB } from '@/lib/mongodb';
import { Message } from '@/models/message.model';
import { getMatchInboxPreviews } from '@/lib/messages';

export type MatchSummary = {
  id: string;
  status: string;
  createdAt: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
};

export async function listUserMatches(userId: string): Promise<MatchSummary[]> {
  const matches = await db.match.findMany({
    where: {
      status: { in: ['PENDING', 'ACCEPTED'] },
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, name: true, avatarUrl: true, verified: true, profile: true } },
      userB: { select: { id: true, name: true, avatarUrl: true, verified: true, profile: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const acceptedIds = matches.filter((m) => m.status === 'ACCEPTED').map((m) => m.id);
  const previews = await getMatchInboxPreviews(userId, acceptedIds);

  return matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
    const preview = previews[m.id];
    return {
      id: m.id,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      otherUser: {
        id: other.id,
        displayName: other.profile?.displayName ?? other.name ?? 'User',
        avatarUrl: other.avatarUrl,
        verified: other.verified,
      },
      lastMessage: preview?.lastMessage ?? null,
      lastMessageAt: preview?.lastMessageAt ?? null,
      unreadCount: preview?.unreadCount ?? 0,
    };
  });
}

export async function getMatchForUser(matchId: string, userId: string) {
  const match = await db.match.findFirst({
    where: {
      id: matchId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, name: true, avatarUrl: true, verified: true, profile: true } },
      userB: { select: { id: true, name: true, avatarUrl: true, verified: true, profile: true } },
    },
  });
  return match;
}

export async function userCanAccessMatch(matchId: string, userId: string): Promise<boolean> {
  const match = await getMatchForUser(matchId, userId);
  return match != null && match.status === 'ACCEPTED';
}

export type MatchChatContext = {
  canSendMessage: boolean;
  ladiesFirstHint: string | null;
};

export async function getMatchChatContext(
  matchId: string,
  userId: string,
): Promise<MatchChatContext | null> {
  const match = await getMatchForUser(matchId, userId);
  if (!match || match.status !== 'ACCEPTED') return null;

  const other = match.userAId === userId ? match.userB : match.userA;
  const [myProfile, otherProfile] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.profile.findUnique({ where: { userId: other.id } }),
  ]);

  if (
    otherProfile?.ladiesFirstMessaging &&
    otherProfile.gender === 'FEMALE' &&
    myProfile?.gender === 'MALE'
  ) {
    await connectMongoDB();
    const priorFromOther = await Message.findOne({
      matchId,
      senderId: other.id,
    });

    if (!priorFromOther) {
      return {
        canSendMessage: false,
        ladiesFirstHint: `${otherProfile.displayName} prefers to message first`,
      };
    }
  }

  return { canSendMessage: true, ladiesFirstHint: null };
}

export async function getAcceptedMatchIds(userId: string): Promise<string[]> {
  const matches = await db.match.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: { id: true },
  });
  return matches.map((m) => m.id);
}
