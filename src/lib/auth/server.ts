import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { toSafeUser, type SafeUser } from '@/lib/api/response';

export async function getServerUser(): Promise<SafeUser | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    if (!payload.sub) return null;

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;

    return toSafeUser(user);
  } catch {
    return null;
  }
}

export async function requireServerUser(): Promise<SafeUser> {
  const user = await getServerUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireOnboardingComplete(user: SafeUser, currentPath: string) {
  if (!user.onboardingCompleted && currentPath !== '/onboarding') {
    redirect('/onboarding');
  }
  if (user.onboardingCompleted && currentPath === '/onboarding') {
    redirect('/dashboard');
  }
}
