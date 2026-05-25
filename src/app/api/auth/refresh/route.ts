import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { authLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = await authLimiter(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests', resetAt: limit.resetAt }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  let payload;
  try {
    payload = await verifyRefreshToken(parsed.data.refreshToken);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token.' }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.isDeleted || user.isBanned) {
    return NextResponse.json({ error: 'User not found or suspended.' }, { status: 401 });
  }

  const accessToken = await generateAccessToken(user.id, user.role);

  return NextResponse.json({ accessToken }, { status: 200 });
}
