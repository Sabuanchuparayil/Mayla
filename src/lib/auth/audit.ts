import { db } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';

type AuditParams = {
  userId?: string;
  action: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        ip: params.ip,
        userAgent: params.userAgent,
        metadata: params.metadata,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to write audit log:', error);
  }
}

export const AuditActions = {
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_LOGIN_FAILED: 'user.login_failed',
  TOKEN_REFRESH: 'token.refresh',
  PROFILE_UPDATE: 'profile.update',
  ONBOARDING_COMPLETE: 'onboarding.complete',
} as const;
