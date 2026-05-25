'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateOTP, verifyOTP as verifyOTPLib } from '@/lib/otp';
import { generateTokenPair } from '@/lib/auth';
import { authLimiter, otpRequestLimiter } from '@/lib/rate-limit';
import { db } from '@/lib/db';

export type AuthActionState = { error: string } | undefined;

async function getClientIP(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function requestOTPAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIP();

  const limit = await authLimiter(ip);
  if (!limit.allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const phone = (formData.get('phone') as string | null)?.trim();
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    return { error: 'Please enter a valid phone number.' };
  }

  const otpLimit = await otpRequestLimiter(phone);
  if (!otpLimit.allowed) {
    return { error: 'OTP limit reached. Try again in 1 hour.' };
  }

  const code = await generateOTP(phone);
  console.warn(`[OTP] ${phone} → ${code}`);

  const cookieStore = await cookies();
  cookieStore.set('otp_identifier', phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  redirect('/verify');
}

export async function verifyOTPAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const ip = await getClientIP();

  const limit = await authLimiter(ip);
  if (!limit.allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const code = (formData.get('code') as string | null)?.trim();
  if (!code || !/^\d{6}$/.test(code)) {
    return { error: 'Please enter a valid 6-digit code.' };
  }

  const cookieStore = await cookies();
  const identifier = cookieStore.get('otp_identifier')?.value;

  if (!identifier) {
    return { error: 'Session expired. Please request a new code.' };
  }

  const result = await verifyOTPLib(identifier, code);

  if (!result.success) {
    const messages: Record<string, string> = {
      expired: 'Code has expired. Please request a new one.',
      invalid: 'Invalid code. Please try again.',
      max_attempts: 'Too many failed attempts. Please request a new code.',
    };
    return { error: messages[result.reason] ?? 'Verification failed.' };
  }

  const isPhone = identifier.startsWith('+');
  const where = isPhone ? { phone: identifier } : { email: identifier };

  let user = await db.user.findFirst({ where });
  const isNewUser = !user;

  if (!user) {
    user = await db.user.create({
      data: {
        ...where,
        ...(isPhone ? { phoneVerifiedAt: new Date() } : { emailVerifiedAt: new Date() }),
      },
    });
  } else if (isPhone && !user.phoneVerifiedAt) {
    user = await db.user.update({ where: { id: user.id }, data: { phoneVerifiedAt: new Date() } });
  } else if (!isPhone && !user.emailVerifiedAt) {
    user = await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }

  if (user.isBanned) {
    return { error: 'Account suspended. Please contact support.' };
  }

  const { accessToken, refreshToken } = await generateTokenPair(user.id, user.role);

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  cookieStore.delete('otp_identifier');

  console.log('[analytics]', JSON.stringify({ event: 'otp_verified', userId: user.id, props: { isNewUser } }));

  redirect(isNewUser ? '/onboarding' : '/discover');
}

export async function resendOTPAction(): Promise<AuthActionState> {
  const ip = await getClientIP();

  const limit = await authLimiter(ip);
  if (!limit.allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const cookieStore = await cookies();
  const identifier = cookieStore.get('otp_identifier')?.value;

  if (!identifier) {
    return { error: 'Session expired. Please start again.' };
  }

  const otpLimit = await otpRequestLimiter(identifier);
  if (!otpLimit.allowed) {
    return { error: 'OTP limit reached. Try again in 1 hour.' };
  }

  const code = await generateOTP(identifier);
  console.warn(`[OTP] ${identifier} → ${code}`);

  cookieStore.set('otp_identifier', identifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return undefined;
}
