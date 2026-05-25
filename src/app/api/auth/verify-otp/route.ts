import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { verifyOTP } from '@/lib/otp';
import { generateTokenPair } from '@/lib/auth';
import { db } from '@/lib/db';
import { authLimiter } from '@/lib/rate-limit';

const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  email: z.email().optional(),
  code: z.string().length(6).regex(/^\d{6}$/),
}).refine((d) => d.phone ?? d.email, { message: 'phone or email is required' });

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

  const { phone, email, code } = parsed.data;
  const identifier = (phone ?? email)!;

  const result = await verifyOTP(identifier, code);

  if (!result.success) {
    const status = result.reason === 'max_attempts' ? 429 : 400;
    const messages: Record<string, string> = {
      expired: 'OTP has expired. Please request a new one.',
      invalid: 'Invalid OTP.',
      max_attempts: 'Too many failed attempts. Please request a new OTP.',
    };
    return NextResponse.json({ error: messages[result.reason] }, { status });
  }

  const where = phone ? { phone } : { email: email! };
  let user = await db.user.findFirst({ where });
  const isNewUser = !user;

  if (!user) {
    user = await db.user.create({
      data: {
        ...where,
        ...(phone ? { phoneVerifiedAt: new Date() } : { emailVerifiedAt: new Date() }),
      },
    });
  } else if (phone && !user.phoneVerifiedAt) {
    user = await db.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
  } else if (email && !user.emailVerifiedAt) {
    user = await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }

  if (user.isBanned) {
    return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
  }

  const { accessToken, refreshToken } = await generateTokenPair(user.id, user.role);

  return NextResponse.json({ accessToken, refreshToken, isNewUser }, { status: 200 });
}
