import { db } from '@/lib/db';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { findNearbyProfiles, getEffectiveProfileCoords } from '@/lib/geo';
import { getSwipeLimit, getUserTier, tierFeatures } from '@/lib/subscription';
import { ensureRedisConnected } from '@/lib/redis';
import { getUserPreferences } from '@/lib/preferences';
import {
  computeCompatibility,
  ageFromBirthDate,
  type CompatibilityProfile,
} from '@/lib/compatibility';
import {
  relationshipGoalLabel,
  relationshipGoalIcon,
  nationalityLabel,
} from '@/lib/constants/profile-options';
import { clearExpiredAvailability, isAvailabilityActive, availabilityLabel } from '@/lib/availability';
import { computeProfileCompleteness } from '@/lib/profile/completeness';
import { getUsersHiddenByContacts, getBlockedContactUserIds } from '@/lib/contacts';
import { gentlemanStars } from '@/lib/gentleman-score';

export type DiscoverProfile = {
  userId: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  country: string;
  verified: boolean;
  photos: string[];
  interests: string[];
  lifestyle: string[];
  languages: string[];
  nationality: string | null;
  relationshipGoal: string | null;
  relationshipGoalLabel: string;
  relationshipGoalIcon: string;
  personalityPrompts: { prompt: string; answer: string }[];
  distanceMeters: number | null;
  age: number | null;
  compatibilityScore: number;
  matchReasons: string[];
  goalMatch: boolean;
  availabilityLabel: string | null;
  isAvailable: boolean;
  gentlemanStars: number;
  dreamDates: string[];
  photosBlurred: boolean;
};

function parseJsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function parsePrompts(value: unknown): { prompt: string; answer: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is { prompt: string; answer: string } =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { prompt?: unknown }).prompt === 'string' &&
      typeof (v as { answer?: unknown }).answer === 'string',
  );
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

function passesPreferenceFilters(
  profile: {
    gender: string | null;
    birthDate: Date | null;
    nationality: string | null;
    languages: unknown;
    relationshipGoal: string | null;
    smoking: string | null;
    drinking: string | null;
  },
  prefs: Awaited<ReturnType<typeof getUserPreferences>>,
  distanceMeters: number | null,
): boolean {
  if (prefs.genderPref.length > 0 && profile.gender) {
    if (!prefs.genderPref.includes(profile.gender)) return false;
  }

  const age = ageFromBirthDate(profile.birthDate);
  if (age != null) {
    if (prefs.ageMin != null && age < prefs.ageMin) return false;
    if (prefs.ageMax != null && age > prefs.ageMax) return false;
  }

  if (prefs.nationalities.length > 0 && profile.nationality) {
    if (!prefs.nationalities.includes(profile.nationality)) return false;
  }

  if (prefs.languages.length > 0) {
    const langs = parseJsonArray(profile.languages);
    const shared = langs.some((l) => prefs.languages.includes(l));
    if (!shared) return false;
  }

  if (prefs.relationshipGoals.length > 0 && profile.relationshipGoal) {
    if (!prefs.relationshipGoals.includes(profile.relationshipGoal as never)) return false;
  }

  if (distanceMeters != null && prefs.maxDistanceKm) {
    if (distanceMeters / 1000 > prefs.maxDistanceKm) return false;
  }

  const dealbreakers = prefs.dealbreakers;
  if (dealbreakers.smoking && profile.smoking && profile.smoking !== dealbreakers.smoking) {
    return false;
  }
  if (dealbreakers.drinking && profile.drinking && profile.drinking !== dealbreakers.drinking) {
    return false;
  }

  return true;
}

export async function getDiscoverFeed(
  userId: string,
  options: { latitude?: number; longitude?: number; limit?: number } = {},
): Promise<{ profiles: DiscoverProfile[]; swipeLimit: number | null; swipesUsedToday: number; canSeeAvailability: boolean; canSendDateRequests: boolean; canSendGifts: boolean }> {
  await clearExpiredAvailability();
  const tier = await getUserTier(userId);
  const features = tierFeatures(tier);
  const swipeLimit = getSwipeLimit(tier);
  const swipesUsedToday = await countSwipesToday(userId);
  const prefs = await getUserPreferences(userId);

  const viewerProfile = await db.profile.findUnique({ where: { userId } });
  const viewerIsFemale = viewerProfile?.gender === 'FEMALE';

  const blocked = await getBlockedUserIds(userId);
  const contactBlocked = await getBlockedContactUserIds(userId);
  const hiddenByContacts = await getUsersHiddenByContacts(userId);
  const swiped = await getSwipedUserIds(userId);
  const exclude = new Set([userId, ...blocked, ...contactBlocked, ...hiddenByContacts, ...swiped]);

  let nearby: Awaited<ReturnType<typeof findNearbyProfiles>> = [];

  const coords =
    options.latitude != null && options.longitude != null
      ? { lat: options.latitude, lng: options.longitude }
      : await getEffectiveProfileCoords(userId);

  const radiusMeters = (prefs.maxDistanceKm ?? 100) * 1000;

  if (coords) {
    nearby = await findNearbyProfiles(
      coords.lat,
      coords.lng,
      radiusMeters,
      userId,
      (options.limit ?? 20) * 3,
    );
  }

  const nearbyIds = nearby.map((p) => p.userId).filter((id) => !exclude.has(id));

  const baseWhere = {
    NOT: { userId: { in: [...exclude] } },
    profilePaused: false,
    user: { onboardingCompleted: true, verified: true },
  };

  let profiles;
  if (nearbyIds.length > 0) {
    profiles = await db.profile.findMany({
      where: { ...baseWhere, userId: { in: nearbyIds } },
      include: { user: { select: { verified: true } } },
      take: (options.limit ?? 20) * 3,
    });
  } else {
    profiles = await db.profile.findMany({
      where: baseWhere,
      include: { user: { select: { verified: true } } },
      take: (options.limit ?? 20) * 3,
      orderBy: { updatedAt: 'desc' },
    });
  }

  const distanceMap = new Map(nearby.map((p) => [p.userId, p.distanceMeters]));

  const incognitoIds = profiles.filter((p) => p.incognitoMode).map((p) => p.userId);
  const visibleIncognito =
    incognitoIds.length > 0
      ? await db.swipe.findMany({
          where: { fromUserId: { in: incognitoIds }, toUserId: userId, action: 'LIKE' },
          select: { fromUserId: true },
        })
      : [];
  const visibleIncognitoSet = new Set(visibleIncognito.map((s) => s.fromUserId));

  const candidatePrefs = await db.userPreference.findMany({
    where: { userId: { in: profiles.map((p) => p.userId) } },
  });
  const prefsMap = new Map(candidatePrefs.map((p) => [p.userId, p]));

  const viewerCompat: CompatibilityProfile = {
    userId,
    birthDate: viewerProfile?.birthDate,
    gender: viewerProfile?.gender,
    nationality: viewerProfile?.nationality,
    languages: parseJsonArray(viewerProfile?.languages),
    interests: parseJsonArray(viewerProfile?.interests),
    lifestyle: parseJsonArray(viewerProfile?.lifestyle),
    dreamDates: parseJsonArray(viewerProfile?.dreamDates),
    relationshipGoal: viewerProfile?.relationshipGoal,
    personalityPrompts: parsePrompts(viewerProfile?.personalityPrompts),
    nationalitiesPref: prefs.nationalities,
  };

  const feed: DiscoverProfile[] = profiles
    .filter((p) => {
      const dist = distanceMap.get(p.userId) ?? null;
      if (!passesPreferenceFilters(p, prefs, dist)) return false;

      if (p.incognitoMode && !visibleIncognitoSet.has(p.userId)) return false;

      const theirPrefs = prefsMap.get(p.userId);
      if (theirPrefs && viewerProfile?.nationality) {
        const hideNats = parseJsonArray(theirPrefs.hideFromNationalities);
        if (hideNats.includes(viewerProfile.nationality)) return false;
      }
      if (theirPrefs && viewerProfile?.city) {
        const hideCities = parseJsonArray(theirPrefs.hideFromCities);
        if (hideCities.some((c) => viewerProfile.city?.toLowerCase().includes(c.toLowerCase()))) {
          return false;
        }
      }

      if (viewerIsFemale && p.gender === 'MALE') {
        const completeness = computeProfileCompleteness(p);
        if (completeness < 70) return false;
      }

      return true;
    })
    .map((p) => {
      const distanceMeters = distanceMap.get(p.userId) ?? null;
      const candidateCompat: CompatibilityProfile = {
        userId: p.userId,
        birthDate: p.birthDate,
        gender: p.gender,
        nationality: p.nationality,
        languages: parseJsonArray(p.languages),
        interests: parseJsonArray(p.interests),
        lifestyle: parseJsonArray(p.lifestyle),
        dreamDates: parseJsonArray(p.dreamDates),
        relationshipGoal: p.relationshipGoal,
        city: p.city,
        distanceMeters,
        personalityPrompts: parsePrompts(p.personalityPrompts),
      };

      const { score, reasons } = computeCompatibility(viewerCompat, candidateCompat);

      const goalMatch =
        !!viewerProfile?.relationshipGoal &&
        viewerProfile.relationshipGoal === p.relationshipGoal;

      if (goalMatch && !reasons.includes('Same relationship goal')) {
        reasons.unshift('Same relationship goal');
      }

      const proximityScore =
        distanceMeters != null ? Math.max(0, 100 - distanceMeters / 1000) : 50;
      const blendedScore = Math.round(0.6 * score + 0.4 * proximityScore);

      const available = isAvailabilityActive(p.availableExpiry);

      return {
        userId: p.userId,
        displayName: p.displayName,
        bio: p.bio,
        city: p.travelModeEnabled ? p.travelCity ?? p.city : p.city,
        country: p.country,
        verified: p.user.verified,
        photos: parseJsonArray(p.photos),
        interests: parseJsonArray(p.interests),
        lifestyle: parseJsonArray(p.lifestyle),
        languages: parseJsonArray(p.languages),
        nationality: p.nationality,
        relationshipGoal: p.relationshipGoal,
        relationshipGoalLabel: relationshipGoalLabel(p.relationshipGoal),
        relationshipGoalIcon: relationshipGoalIcon(p.relationshipGoal),
        personalityPrompts: parsePrompts(p.personalityPrompts),
        distanceMeters,
        age: ageFromBirthDate(p.birthDate),
        compatibilityScore: blendedScore,
        matchReasons: reasons.slice(0, 3),
        goalMatch,
        availabilityLabel: available ? availabilityLabel(p.availableDay, p.availableTime) : null,
        isAvailable: available,
        gentlemanStars: p.gender === 'MALE' ? gentlemanStars(p.gentlemanScore) : 0,
        dreamDates: parseJsonArray(p.dreamDates).slice(0, 3),
        photosBlurred: p.photoBlurUntilMatch,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, options.limit ?? 20);

  return {
    profiles: feed,
    swipeLimit,
    swipesUsedToday,
    canSeeAvailability: features.canSeeAvailability,
    canSendDateRequests: features.dateRequestsPerWeek !== 0,
    canSendGifts: features.canSendGifts,
  };
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
): Promise<{ matched: boolean; matchId?: string; compatibilityScore?: number; matchReasons?: string[] }> {
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

  const [viewerProfile, targetProfile] = await Promise.all([
    db.profile.findUnique({ where: { userId: fromUserId } }),
    db.profile.findUnique({ where: { userId: toUserId } }),
  ]);

  const viewerCompat: CompatibilityProfile = {
    userId: fromUserId,
    birthDate: viewerProfile?.birthDate,
    nationality: viewerProfile?.nationality,
    languages: parseJsonArray(viewerProfile?.languages),
    interests: parseJsonArray(viewerProfile?.interests),
    lifestyle: parseJsonArray(viewerProfile?.lifestyle),
    relationshipGoal: viewerProfile?.relationshipGoal,
    personalityPrompts: parsePrompts(viewerProfile?.personalityPrompts),
  };

  const targetCompat: CompatibilityProfile = {
    userId: toUserId,
    birthDate: targetProfile?.birthDate,
    nationality: targetProfile?.nationality,
    languages: parseJsonArray(targetProfile?.languages),
    interests: parseJsonArray(targetProfile?.interests),
    lifestyle: parseJsonArray(targetProfile?.lifestyle),
    relationshipGoal: targetProfile?.relationshipGoal,
    personalityPrompts: parsePrompts(targetProfile?.personalityPrompts),
  };

  const { score, reasons } = computeCompatibility(viewerCompat, targetCompat);

  return {
    matched: true,
    matchId: match.id,
    compatibilityScore: score,
    matchReasons: reasons,
  };
}

export async function getDailyPicks(userId: string, limit = 10): Promise<DiscoverProfile[]> {
  const feed = await getDiscoverFeed(userId, { limit: limit * 2 });
  return feed.profiles.slice(0, limit);
}

export { nationalityLabel };
