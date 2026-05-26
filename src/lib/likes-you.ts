import { db } from '@/lib/db';
import { getUserTier, tierFeatures } from '@/lib/subscription';
import { hasReferralReveal } from '@/lib/referral';
import { AppError, ErrorCodes } from '@/lib/api/errors';

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export type LikeEntry = {
  userId: string;
  displayName: string;
  photos: string[];
  blurred: boolean;
  likedAt: string;
  compatibilityHint: string | null;
};

export async function getLikesYou(userId: string): Promise<{
  likes: LikeEntry[];
  total: number;
  canReveal: boolean;
  referralReveal: boolean;
  inviteToReveal: boolean;
}> {
  const tier = await getUserTier(userId);
  const canReveal = tierFeatures(tier).seeWhoLikedYou;
  const referralReveal = !canReveal ? await hasReferralReveal(userId) : false;

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

  const profiles = await db.profile.findMany({
    where: { userId: { in: pending.map((p) => p.fromUserId) } },
    select: { userId: true, displayName: true, photos: true, city: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const likes: LikeEntry[] = pending.map((s, index) => {
    const p = profileMap.get(s.fromUserId);
    const photos = parseJsonArray(p?.photos);
    const revealThis = canReveal || (referralReveal && index === 0);
    return {
      userId: s.fromUserId,
      displayName: revealThis ? (p?.displayName ?? 'Someone') : 'Someone liked you',
      photos: revealThis ? photos : photos.length ? ['blur'] : [],
      blurred: !revealThis,
      likedAt: s.createdAt.toISOString(),
      compatibilityHint: revealThis ? (p?.city ?? null) : null,
    };
  });

  return {
    likes,
    total: likes.length,
    canReveal,
    referralReveal,
    inviteToReveal: !canReveal && !referralReveal && likes.length > 0,
  };
}

export async function likeBack(userId: string, targetUserId: string) {
  const existing = await db.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: targetUserId, toUserId: userId } },
  });
  if (!existing || existing.action !== 'LIKE') {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Like not found', 404);
  }

  const [userAId, userBId] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
  await db.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId } },
    create: { fromUserId: userId, toUserId: targetUserId, action: 'LIKE' },
    update: { action: 'LIKE' },
  });

  const match = await db.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, status: 'ACCEPTED' },
    update: { status: 'ACCEPTED' },
  });

  return { matchId: match.id };
}
