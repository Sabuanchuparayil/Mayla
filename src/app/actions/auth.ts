'use server';

import { redirect } from 'next/navigation';
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/cookies';
import { loginUser } from '@/lib/auth/service';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { revokeRefreshToken } from '@/lib/auth/session';
import { AppError } from '@/lib/api/errors';
import { headers } from 'next/headers';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  let destination = '/onboarding';

  try {
    const result = await loginUser(
      { email, password },
      { ip, userAgent: headersList.get('user-agent') ?? undefined },
    );
    destination = result.user.onboardingCompleted ? '/dashboard' : '/onboarding';
  } catch (error) {
    if (error instanceof AppError) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  redirect(destination);
}

export async function logoutAction() {
  const refreshToken = await getRefreshTokenFromCookies();
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload.jti) {
        await revokeRefreshToken(payload.jti);
      }
    } catch {
      // continue clearing cookies
    }
  }

  await clearAuthCookies();
  redirect('/login');
}
