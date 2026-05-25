import { db } from '@/lib/db';

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

  return matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
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
