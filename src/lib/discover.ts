import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { findNearbyProfiles, getEffectiveProfileCoords } from '@/lib/geo';
import { getSwipeLimit, getUserTier } from '@/lib/subscription';
import { ensureRedisConnected } from '@/lib/redis';

export type DiscoverProfile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string;
  verified: boolean;
  photos: string[];
  interests: string[];
  distanceMeters: number | null;
  age: number | null;
};

function ageFromBirthDate(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await db.userBlock.findMany({
    where: {
      OR: [{ blockerId: userId }, { blockedId: userId }],
    },
    select: { blockerId: true, blockedId: true },
  });
  return blocks.flatMap((b) => (b.blockerId === userId ? [b.blockedId] : [b.blockerId]));
}

async function getSwipedUserIds(userId: string): Promise<string[]> {
  const swipes = await db.swipe.findMany({
    where: { fromUserId: userId },
    select: { toUserId: true },
  });
  return swipes.map((s) => s.toUserId);
}

export async function getDiscoverFeed(
  userId: string,
  options: { latitude?: number; longitude?: number; limit?: number } = {},
): Promise<{ profiles: DiscoverProfile[]; swipeLimit: number | null; swipesUsedToday: number }> {
  const tier = await getUserTier(userId);
  const swipeLimit = getSwipeLimit(tier);
  const swipesUsedToday = await countSwipesToday(userId);

  const blocked = await getBlockedUserIds(userId);
  const swiped = await getSwipedUserIds(userId);
  const exclude = new Set([userId, ...blocked, ...swiped]);

  let nearby: Awaited<ReturnType<typeof findNearbyProfiles>> = [];

  const coords =
    options.latitude != null && options.longitude != null
      ? { lat: options.latitude, lng: options.longitude }
      : await getEffectiveProfileCoords(userId);

  if (coords) {
    nearby = await findNearbyProfiles(coords.lat, coords.lng, 100_000, userId, options.limit ?? 20);
  }

  const nearbyIds = nearby.map((p) => p.userId).filter((id) => !exclude.has(id));

  const baseWhere = {
    NOT: { userId: { in: [...exclude] } },
    user: { onboardingCompleted: true, verified: true },
  };

  let profiles;
  if (nearbyIds.length > 0) {
    profiles = await db.profile.findMany({
      where: { ...baseWhere, userId: { in: nearbyIds } },
      include: { user: { select: { verified: true } } },
      take: options.limit ?? 20,
      orderBy: { updatedAt: 'desc' },
    });
  } else {
    profiles = await db.profile.findMany({
      where: baseWhere,
      include: { user: { select: { verified: true } } },
      take: options.limit ?? 20,
      orderBy: { updatedAt: 'desc' },
    });
  }

  const distanceMap = new Map(nearby.map((p) => [p.userId, p.distanceMeters]));

  const feed: DiscoverProfile[] = profiles.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    bio: p.bio,
    city: p.travelModeEnabled ? p.travelCity ?? p.city : p.city,
    country: p.country,
    verified: p.user.verified,
    photos: parseJsonArray(p.photos),
    interests: parseJsonArray(p.interests),
    distanceMeters: distanceMap.get(p.userId) ?? null,
    age: ageFromBirthDate(p.birthDate),
  }));

  return { profiles: feed, swipeLimit, swipesUsedToday };
}

export async function countSwipesToday(userId: string): Promise<number> {
  const redis = await ensureRedisConnected();
  const key = `swipes:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.get(key);
  return count ? Number(count) : 0;
}

async function incrementSwipeCount(userId: string): Promise<number> {
  const redis = await ensureRedisConnected();
  const key = `swipes:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400);
  return count;
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function recordSwipe(
  fromUserId: string,
  toUserId: string,
  action: 'LIKE' | 'PASS',
): Promise<{ matched: boolean; matchId?: string }> {
  if (fromUserId === toUserId) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot swipe on yourself', 422);
  }

  const blockExists = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: fromUserId, blockedId: toUserId },
        { blockerId: toUserId, blockedId: fromUserId },
      ],
    },
    select: { id: true },
  });
  if (blockExists) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot interact with this user', 403);
  }

  const tier = await getUserTier(fromUserId);
  const limit = getSwipeLimit(tier);
  if (limit !== null) {
    const used = await countSwipesToday(fromUserId);
    if (used >= limit) {
      throw new Error('Daily swipe limit reached. Upgrade to Gold for unlimited swipes.');
    }
  }

  await db.swipe.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId, action },
    update: { action },
  });

  await incrementSwipeCount(fromUserId);

  if (action === 'PASS') {
    return { matched: false };
  }

  const reciprocal = await db.swipe.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  });

  if (!reciprocal || reciprocal.action !== 'LIKE') {
    const [userAId, userBId] = orderedPair(fromUserId, toUserId);
    await db.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId, status: 'PENDING' },
      update: {},
    });
    return { matched: false };
  }

  const [userAId, userBId] = orderedPair(fromUserId, toUserId);
  const match = await db.match.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId, status: 'ACCEPTED' },
    update: { status: 'ACCEPTED' },
  });

  return { matched: true, matchId: match.id };
}
