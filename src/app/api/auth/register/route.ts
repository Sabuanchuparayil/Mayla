import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { generateOTP } from '@/lib/otp';
import { otpRequestLimiter, authLimiter } from '@/lib/rate-limit';

const schema = z
  .object({
    phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
    email: z.email().optional(),
  })
  .refine((d) => d.phone ?? d.email, {
    message: 'phone or email is required',
  });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const ipLimit = await authLimiter(ip);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', resetAt: ipLimit.resetAt },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const identifier = (parsed.data.phone ?? parsed.data.email)!;

  const otpLimit = await otpRequestLimiter(identifier);
  if (!otpLimit.allowed) {
    return NextResponse.json(
      { error: 'OTP limit reached. Try again in 1 hour.', resetAt: otpLimit.resetAt },
      { status: 429 },
    );
  }

  const code = await generateOTP(identifier);

  // TODO: replace with real SMS / email delivery
  console.warn(`[OTP] ${identifier} → ${code}`);

  return NextResponse.json(
    { message: 'OTP sent', expiresIn: 300 },
    { status: 200 },
  );
}
