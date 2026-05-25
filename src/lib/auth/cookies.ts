import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/lib/constants';
import { getAccessTokenMaxAge, getRefreshTokenMaxAge } from './jwt';

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production'),
  sameSite: 'lax' as const,
  path: '/',
};

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.accessToken, accessToken, {
    ...baseCookieOptions,
    maxAge: getAccessTokenMaxAge(),
  });
  cookieStore.set(COOKIE_NAMES.refreshToken, refreshToken, {
    ...baseCookieOptions,
    maxAge: getRefreshTokenMaxAge(),
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.accessToken);
  cookieStore.delete(COOKIE_NAMES.refreshToken);
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
}

export function getAuthCookieOptions() {
  return { names: COOKIE_NAMES, base: baseCookieOptions };
}
