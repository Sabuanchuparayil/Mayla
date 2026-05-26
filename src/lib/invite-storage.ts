'use client';

import { useEffect } from 'react';

const INVITE_COOKIE = 'mayla_invite_code';
const SQUAD_COOKIE = 'mayla_invite_squad';

export function setInviteCookies(code: string, isSquad: boolean) {
  document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(code.toUpperCase())}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  if (isSquad) {
    document.cookie = `${SQUAD_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
}

export function getInviteCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${INVITE_COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function isSquadInviteFromCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${SQUAD_COOKIE}=1`);
}

export function InviteCodeCapture({ code, isSquad }: { code: string; isSquad: boolean }) {
  useEffect(() => {
    setInviteCookies(code, isSquad);
    try {
      localStorage.setItem(INVITE_COOKIE, code.toUpperCase());
      if (isSquad) localStorage.setItem(SQUAD_COOKIE, '1');
    } catch {
      // ignore
    }
  }, [code, isSquad]);

  return null;
}

export function readStoredInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(INVITE_COOKIE) ?? getInviteCodeFromCookie();
  } catch {
    return getInviteCodeFromCookie();
  }
}

export function readStoredSquadInvite(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SQUAD_COOKIE) === '1' || isSquadInviteFromCookie();
  } catch {
    return isSquadInviteFromCookie();
  }
}

export function clearStoredInviteCode() {
  if (typeof window === 'undefined') return;
  document.cookie = `${INVITE_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${SQUAD_COOKIE}=; path=/; max-age=0`;
  try {
    localStorage.removeItem(INVITE_COOKIE);
    localStorage.removeItem(SQUAD_COOKIE);
  } catch {
    // ignore
  }
}
