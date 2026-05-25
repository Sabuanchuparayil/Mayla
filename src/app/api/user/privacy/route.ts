import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

const schema = z.object({
  isVisible: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.profile.findFirst({
    where: { userId },
    select: { isVisible: true },
  });

  return NextResponse.json({ privacy: profile ?? null });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { isVisible } = parsed.data;
  if (isVisible === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  await db.profile.updateMany({
    where: { userId },
    data: { isVisible },
  });

  // Bust discovery cache — disappear from / reappear in stacks immediately
  await redis.del(`discovery:stack:${userId}`);

  return NextResponse.json({ updated: true });
}
