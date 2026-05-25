import { db } from '@/lib/db';
import type { Gender, RelationshipIntent } from '@/generated/prisma/enums';

// Canonical shape consumed by ProfileCard, SwipeStack, ProfileModal and NearbyGrid.
export interface DiscoveryCard {
  userId: string;
  name: string;
  birthDate: string; // ISO string
  primaryPhotoUrl: string;
  photos: string[]; // additional photos (primary excluded)
  distanceKm?: number;
  isVerified: boolean;
  relationshipIntent?: string;
  genderDisplay?: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  prompts: { question: string; answer: string }[];
}

const INTENT_LABELS: Record<RelationshipIntent, string> = {
  LONG_TERM: 'Long-term',
  SHORT_TERM: 'Short-term',
  CASUAL: 'Casual',
  FRIENDSHIP: 'Friends',
  NOT_SURE: 'Still figuring it out',
};

const GENDER_LABELS: Record<Gender, string> = {
  MAN: 'Man',
  WOMAN: 'Woman',
  NON_BINARY: 'Non-binary',
  OTHER: 'Other',
};

/**
 * Builds discovery cards for the given user ids in the exact shape the UI
 * expects. `distanceMap` maps userId → distance in metres (or null/undefined
 * when location is unknown); the result preserves the input ordering.
 */
export async function buildDiscoveryCards(
  userIds: string[],
  distanceMap?: Map<string, number | null>,
): Promise<DiscoveryCard[]> {
  if (userIds.length === 0) return [];

  const [profiles, photos, profilePrompts, verifications] = await Promise.all([
    db.profile.findMany({ where: { userId: { in: userIds } } }),
    db.photo.findMany({
      where: { userId: { in: userIds }, isVerified: true },
      orderBy: { order: 'asc' },
    }),
    db.profilePrompt.findMany({
      where: { profile: { userId: { in: userIds } } },
      include: { prompt: true },
      orderBy: { order: 'asc' },
    }),
    db.verification.findMany({
      where: { userId: { in: userIds }, status: 'APPROVED' },
      select: { userId: true },
    }),
  ]);

  const verifiedSet = new Set(verifications.map((v) => v.userId));

  const photosByUser = new Map<string, string[]>();
  for (const photo of photos) {
    if (!photosByUser.has(photo.userId)) photosByUser.set(photo.userId, []);
    photosByUser.get(photo.userId)!.push(photo.url);
  }

  const promptsByProfileId = new Map<string, { question: string; answer: string }[]>();
  for (const pp of profilePrompts) {
    if (!promptsByProfileId.has(pp.profileId)) promptsByProfileId.set(pp.profileId, []);
    promptsByProfileId.get(pp.profileId)!.push({
      question: pp.prompt.question,
      answer: pp.answer,
    });
  }

  const cardByUserId = new Map<string, DiscoveryCard>();
  for (const profile of profiles) {
    const urls = photosByUser.get(profile.userId) ?? [];
    const distanceM = distanceMap?.get(profile.userId);

    cardByUserId.set(profile.userId, {
      userId: profile.userId,
      name: profile.name,
      birthDate: profile.birthDate.toISOString(),
      primaryPhotoUrl: urls[0] ?? '',
      photos: urls.slice(1),
      ...(distanceM != null ? { distanceKm: Math.round(distanceM / 100) / 10 } : {}),
      isVerified: verifiedSet.has(profile.userId),
      ...(profile.relationshipIntent
        ? { relationshipIntent: INTENT_LABELS[profile.relationshipIntent] }
        : {}),
      genderDisplay: GENDER_LABELS[profile.gender],
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      prompts: promptsByProfileId.get(profile.id) ?? [],
    });
  }

  // Preserve the incoming ordering (distance- or recency-sorted by the caller).
  return userIds
    .map((id) => cardByUserId.get(id))
    .filter((c): c is DiscoveryCard => c !== undefined);
}
