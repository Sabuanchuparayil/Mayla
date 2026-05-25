import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { createMatch } from '@/lib/matches';
import { SwipeAction, SubscriptionPlan } from '@/generated/prisma/enums';

const SwipeBody = z.object({
  targetId: z.string().min(1),
  action: z.enum(['LIKE', 'DISLIKE', 'SUPER_LIKE']),
});

// Daily swipe limits for LIKE / SUPER_LIKE (DISLIKE is unlimited)
const DAILY_LIMITS: Record<SubscriptionPlan, number | null> = {
  [SubscriptionPlan.BASIC]: 20,
  [SubscriptionPlan.GOLD]: 50,
  [SubscriptionPlan.PLATINUM]: null, // unlimited
};

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SwipeBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { targetId, action } = parsed.data;

  // Check daily swipe limit for LIKE and SUPER_LIKE
  if (action === 'LIKE' || action === 'SUPER_LIKE') {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan: SubscriptionPlan =
      (user.subscriptions[0]?.plan as SubscriptionPlan | undefined) ??
      SubscriptionPlan.BASIC;

    const limit = DAILY_LIMITS[plan];

    if (limit !== null) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const countKey = `swipe:daily:${userId}:${today}`;

      const current = await redis.incr(countKey);
      if (current === 1) {
        // Set TTL only on first increment
        await redis.expire(countKey, secondsUntilMidnightUTC());
      }

      if (current > limit) {
        return NextResponse.json(
          { error: 'Daily swipe limit reached', limit },
          { status: 429 },
        );
      }
    }
  }

  // Check if already swiped
  const existing = await db.swipe.findUnique({
    where: { swiperId_swipedId: { swiperId: userId, swipedId: targetId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Already swiped on this user' }, { status: 409 });
  }

  // Create swipe
  const swipe = await db.swipe.create({
    data: {
      swiperId: userId,
      swipedId: targetId,
      action: action as SwipeAction,
    },
  });

  // Invalidate discovery cache
  await redis.del(`discovery:stack:${userId}`);

  // Check for mutual match
  let matched = false;
  let matchId: string | undefined;

  if (action === 'LIKE' || action === 'SUPER_LIKE') {
    const mutualSwipe = await db.swipe.findFirst({
      where: {
        swiperId: targetId,
        swipedId: userId,
        action: { in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
      },
    });

    if (mutualSwipe) {
      // Check if a match already exists (e.g., race condition)
      const sortedIds = [userId, targetId].sort();
      const existingMatch = await db.match.findUnique({
        where: { user1Id_user2Id: { user1Id: sortedIds[0]!, user2Id: sortedIds[1]! } },
      });

      if (!existingMatch) {
        matchId = await createMatch(userId, targetId);
        matched = true;
      } else {
        matched = existingMatch.status === 'ACTIVE';
        matchId = existingMatch.id;
      }
    }
  }

  return NextResponse.json({
    swipeId: swipe.id,
    matched,
    ...(matchId ? { matchId } : {}),
  });
}
