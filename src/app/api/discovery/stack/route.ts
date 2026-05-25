import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { buildDiscoveryCards } from '@/lib/discovery-cards';

export const dynamic = 'force-dynamic';

type CandidateRow = { user_id: string; distance_m: number | null };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check Redis cache
  const cacheKey = `discovery:stack:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  // Get current user's profile
  const myProfile = await db.profile.findUnique({ where: { userId } });
  if (!myProfile) {
    return NextResponse.json([], { status: 200 });
  }

  const hasLocation =
    myProfile.latitude != null && myProfile.longitude != null;

  const genderPrefs = myProfile.genderPreference;
  const minAge = myProfile.minAgePreference;
  const maxAge = myProfile.maxAgePreference;
  const maxDistanceM = (myProfile.maxDistance ?? 50) * 1000;

  let candidates: CandidateRow[];

  if (hasLocation && myProfile.longitude != null && myProfile.latitude != null) {
    const lng = myProfile.longitude;
    const lat = myProfile.latitude;
    candidates = await db.$queryRaw<CandidateRow[]>(Prisma.sql`
      SELECT p.user_id, ST_Distance(p.location::geography, ST_MakePoint(${lng}, ${lat})::geography) as distance_m
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
      ORDER BY RANDOM()
      LIMIT 20
    `);
  } else {
    // No location filter
    candidates = await db.$queryRaw<CandidateRow[]>(Prisma.sql`
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
      ORDER BY RANDOM()
      LIMIT 20
    `);
  }

  const distanceMap = new Map<string, number | null>();
  for (const row of candidates) {
    distanceMap.set(row.user_id, row.distance_m);
  }

  const userIds = candidates.map((c) => c.user_id);
  const cards = await buildDiscoveryCards(userIds, distanceMap);

  // Cache result
  await redis.setex(cacheKey, 300, JSON.stringify(cards));

  return NextResponse.json(cards);
}
