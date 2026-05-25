import { NextResponse } from 'next/server';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiSuccess<T>(data: T, init?: ResponseInit, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, init);
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  const body: ApiErrorBody = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export type SafeUser = {
  id: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  verified: boolean;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export function toSafeUser(user: {
  id: string;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  verified?: boolean;
  onboardingCompleted: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    phone: user.phone ?? null,
    email: user.email ?? null,
    username: user.username ?? null,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    verified: user.verified ?? false,
    onboardingCompleted: user.onboardingCompleted,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
