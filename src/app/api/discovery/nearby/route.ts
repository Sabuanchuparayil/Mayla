import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

type CandidateRow = { user_id: string; distance_m: number | null };

interface ProfileCard {
  userId: string;
  name: string;
  age: number;
  gender: string;
  city: string | null;
  country: string | null;
  bio: string | null;
  distanceKm: number | null;
  interests: string[];
  photos: { url: string; order: number }[];
  prompt: { question: string; answer: string } | null;
  isVerified: boolean;
}

function calcAge(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age;
}

async function buildProfileCards(
  userIds: string[],
  distanceMap: Map<string, number | null>,
): Promise<ProfileCard[]> {
  if (userIds.length === 0) return [];

  const profiles = await db.profile.findMany({
    where: { userId: { in: userIds } },
  });

  const photos = await db.photo.findMany({
    where: { userId: { in: userIds }, isVerified: true },
    orderBy: { order: 'asc' },
  });

  const profilePrompts = await db.profilePrompt.findMany({
    where: { profile: { userId: { in: userIds } }, order: 0 },
    include: { prompt: true },
    orderBy: { order: 'asc' },
  });

  const verifications = await db.verification.findMany({
    where: { userId: { in: userIds }, status: 'APPROVED' },
    select: { userId: true },
  });

  const verifiedSet = new Set(verifications.map((v) => v.userId));

  const photosByUser = new Map<string, { url: string; order: number }[]>();
  for (const photo of photos) {
    if (!photosByUser.has(photo.userId)) photosByUser.set(photo.userId, []);
    photosByUser.get(photo.userId)!.push({ url: photo.url, order: photo.order });
  }

  const promptByProfileId = new Map<string, { question: string; answer: string }>();
  for (const pp of profilePrompts) {
    if (!promptByProfileId.has(pp.profileId)) {
      promptByProfileId.set(pp.profileId, {
        question: pp.prompt.question,
        answer: pp.answer,
      });
    }
  }

  const cards: ProfileCard[] = [];
  for (const profile of profiles) {
    const dm = distanceMap.get(profile.userId);
    cards.push({
      userId: profile.userId,
      name: profile.name,
      age: calcAge(profile.birthDate),
      gender: profile.gender,
      city: profile.city,
      country: profile.country,
      bio: profile.bio,
      distanceKm: dm != null ? Math.round(dm / 100) / 10 : null,
      interests: profile.interests,
      photos: photosByUser.get(profile.userId) ?? [],
      prompt: promptByProfileId.get(profile.id) ?? null,
      isVerified: verifiedSet.has(profile.userId),
    });
  }

  // Re-sort to preserve distance ordering from the SQL query
  const indexMap = new Map(userIds.map((id, i) => [id, i]));
  cards.sort((a, b) => (indexMap.get(a.userId) ?? 0) - (indexMap.get(b.userId) ?? 0));

  return cards;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const myProfile = await db.profile.findUnique({ where: { userId } });
  if (!myProfile) {
    return NextResponse.json({ profiles: [], total: 0, page, hasMore: false });
  }

  const hasLocation =
    myProfile.latitude != null && myProfile.longitude != null;

  const genderPrefs = myProfile.genderPreference;
  const minAge = myProfile.minAgePreference;
  const maxAge = myProfile.maxAgePreference;
  const maxDistanceM = (myProfile.maxDistance ?? 50) * 1000;

  let rows: CandidateRow[];
  let countRows: { count: bigint }[];

  if (hasLocation && myProfile.longitude != null && myProfile.latitude != null) {
    const lng = myProfile.longitude;
    const lat = myProfile.latitude;

    countRows = await db.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) as count
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      JOIN verifications v ON v.user_id = p.user_id
      WHERE u.is_banned = false
        AND u.is_deleted = false
        AND v.status = 'APPROVED'
        AND p.user_id != ${userId}
        AND p.is_visible = true
        AND p.user_id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = ${userId})
        AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${userId})
        AND p.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${userId})
        AND p.gender = ANY(${genderPrefs}::text[])
        AND EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN ${minAge} AND ${maxAge}
        AND (p.location IS NULL OR ST_DWithin(p.location::geography, ST_MakePoint(${lng}, ${lat})::geography, ${maxDistanceM}))
    `);

    rows = await db.$queryRaw<CandidateRow[]>(Prisma.sql`
      SELECT p.user_id,
             ST_Distance(p.location::geography, ST_MakePoint(${lng}, ${lat})::geography) as distance_m
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      JOIN verifications v ON v.user_id = p.user_id
      WHERE u.is_banned = false
        AND u.is_deleted = false
        AND v.status = 'APPROVED'
        AND p.user_id != ${userId}
        AND p.is_visible = true
        AND p.user_id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = ${userId})
        AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${userId})
        AND p.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${userId})
        AND p.gender = ANY(${genderPrefs}::text[])
        AND EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN ${minAge} AND ${maxAge}
        AND (p.location IS NULL OR ST_DWithin(p.location::geography, ST_MakePoint(${lng}, ${lat})::geography, ${maxDistanceM}))
      ORDER BY distance_m ASC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);
  } else {
    countRows = await db.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) as count
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      JOIN verifications v ON v.user_id = p.user_id
      WHERE u.is_banned = false
        AND u.is_deleted = false
        AND v.status = 'APPROVED'
        AND p.user_id != ${userId}
        AND p.is_visible = true
        AND p.user_id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = ${userId})
        AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${userId})
        AND p.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${userId})
        AND p.gender = ANY(${genderPrefs}::text[])
        AND EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN ${minAge} AND ${maxAge}
    `);

    rows = await db.$queryRaw<CandidateRow[]>(Prisma.sql`
      SELECT p.user_id, NULL::float as distance_m
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      JOIN verifications v ON v.user_id = p.user_id
      WHERE u.is_banned = false
        AND u.is_deleted = false
        AND v.status = 'APPROVED'
        AND p.user_id != ${userId}
        AND p.is_visible = true
        AND p.user_id NOT IN (SELECT swiped_id FROM swipes WHERE swiper_id = ${userId})
        AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${userId})
        AND p.user_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${userId})
        AND p.gender = ANY(${genderPrefs}::text[])
        AND EXTRACT(YEAR FROM AGE(p.birth_date)) BETWEEN ${minAge} AND ${maxAge}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
  }

  const total = Number(countRows[0]?.count ?? 0);

  const distanceMap = new Map<string, number | null>();
  for (const row of rows) {
    distanceMap.set(row.user_id, row.distance_m);
  }

  const userIds = rows.map((r) => r.user_id);
  const profiles = await buildProfileCards(userIds, distanceMap);

  return NextResponse.json({
    profiles,
    total,
    page,
    hasMore: offset + rows.length < total,
  });
}
