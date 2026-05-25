import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const schema = z.object({
  blockedUserId: z.string().min(1),
});

// GET /api/blocks — list users the current user has blocked
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocks = await db.block.findMany({
    where: { blockerId: userId },
    select: {
      id: true,
      blockedId: true,
      createdAt: true,
      blocked: {
        select: {
          id: true,
          profile: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ blocks });
}

// POST /api/blocks — block a user
export async function POST(req: NextRequest) {
  const blockerId = req.headers.get('x-user-id');
  if (!blockerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { blockedUserId } = parsed.data;
  if (blockerId === blockedUserId) {
    return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
  }

  const targetExists = await db.user.findUnique({
    where: { id: blockedUserId },
    select: { id: true },
  });
  if (!targetExists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Upsert — silently succeed if already blocked
  const block = await db.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId: blockedUserId } },
    create: { blockerId, blockedId: blockedUserId },
    update: {},
    select: { id: true, createdAt: true },
  });

  // Expire any active matches between the two users
  await db.match.updateMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { user1Id: blockerId, user2Id: blockedUserId },
        { user1Id: blockedUserId, user2Id: blockerId },
      ],
    },
    data: { status: 'UNMATCHED', unmatchedAt: new Date(), unmatchedById: blockerId },
  });

  // Bust discovery cache for both users
  await redis.del(`discovery:stack:${blockerId}`, `discovery:stack:${blockedUserId}`);

  return NextResponse.json({ blockId: block.id }, { status: 201 });
}
