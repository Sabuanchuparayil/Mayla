import { db } from '@/lib/db';
import { getUserTier, tierFeatures } from '@/lib/subscription';
import { relationshipGoalLabel } from '@/lib/constants/profile-options';

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export type LookingForYouEntry = {
  userId: string;
  displayName: string;
  relationshipGoal: string | null;
  relationshipGoalLabel: string;
  likedAt: string;
  city: string | null;
};

export async function getLookingForYou(userId: string): Promise<{
  entries: LookingForYouEntry[];
  total: number;
  enabled: boolean;
}> {
  const tier = await getUserTier(userId);
  const enabled = tierFeatures(tier).lookingForYou;
  if (!enabled) return { entries: [], total: 0, enabled: false };

  const viewerProfile = await db.profile.findUnique({
    where: { userId },
    select: { relationshipGoal: true },
  });
  if (!viewerProfile?.relationshipGoal) {
    return { entries: [], total: 0, enabled: true };
  }

  const incomingLikes = await db.swipe.findMany({
    where: { toUserId: userId, action: 'LIKE' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const likedByIds = incomingLikes.map((s) => s.fromUserId);
  const myLikes = await db.swipe.findMany({
    where: { fromUserId: userId, toUserId: { in: likedByIds }, action: 'LIKE' },
    select: { toUserId: true },
  });
  const alreadyMatched = new Set(myLikes.map((s) => s.toUserId));

  const pending = incomingLikes.filter((s) => !alreadyMatched.has(s.fromUserId));
  if (pending.length === 0) return { entries: [], total: 0, enabled: true };

  const profiles = await db.profile.findMany({
    where: {
      userId: { in: pending.map((p) => p.fromUserId) },
      relationshipGoal: viewerProfile.relationshipGoal,
    },
    select: { userId: true, displayName: true, relationshipGoal: true, city: true, photos: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const entries: LookingForYouEntry[] = pending
    .filter((s) => profileMap.has(s.fromUserId))
    .map((s) => {
      const p = profileMap.get(s.fromUserId)!;
      return {
        userId: s.fromUserId,
        displayName: p.displayName,
        relationshipGoal: p.relationshipGoal,
        relationshipGoalLabel: relationshipGoalLabel(p.relationshipGoal),
        likedAt: s.createdAt.toISOString(),
        city: p.city,
      };
    });

  return { entries, total: entries.length, enabled: true };
}
