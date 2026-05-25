import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

const schema = z.object({
  ban: z.boolean(),
});

// POST /api/admin/users/:userId/ban — ban or unban a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const role = req.headers.get('x-user-role');
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — ADMIN only' }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { isBanned: parsed.data.ban },
    select: { id: true, isBanned: true },
  });

  // Bust discovery cache so banned user disappears immediately
  await redis.del(`discovery:stack:${userId}`);

  return NextResponse.json({ userId: user.id, isBanned: user.isBanned });
}
