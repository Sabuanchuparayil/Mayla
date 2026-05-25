import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

const schema = z.object({
  minAgePreference: z.int().min(18).max(99).optional(),
  maxAgePreference: z.int().min(18).max(99).optional(),
  maxDistance: z.int().min(1).max(500).optional(),
  genderPreference: z.array(z.enum(['MAN', 'WOMAN', 'NON_BINARY', 'OTHER'])).optional(),
}).refine(
  (d) => !d.minAgePreference || !d.maxAgePreference || d.minAgePreference <= d.maxAgePreference,
  { message: 'minAgePreference must be ≤ maxAgePreference' },
);

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await db.profile.findFirst({
    where: { userId },
    select: {
      minAgePreference: true,
      maxAgePreference: true,
      maxDistance: true,
      genderPreference: true,
    },
  });

  return NextResponse.json({ preferences: profile ?? null });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  const profile = await db.profile.updateMany({
    where: { userId },
    data: {
      ...(data.minAgePreference !== undefined && { minAgePreference: data.minAgePreference }),
      ...(data.maxAgePreference !== undefined && { maxAgePreference: data.maxAgePreference }),
      ...(data.maxDistance !== undefined && { maxDistance: data.maxDistance }),
      ...(data.genderPreference !== undefined && { genderPreference: data.genderPreference }),
    },
  });

  if (profile.count === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Bust discovery cache so updated preferences apply immediately
  await redis.del(`discovery:stack:${userId}`);

  return NextResponse.json({ updated: true });
}
