export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess, toSafeUser } from '@/lib/api/response';
import { parseBody } from '@/lib/api/validate';
import { requireCurrentUser } from '@/lib/auth/guard';
import { createAuditLog, AuditActions } from '@/lib/auth/audit';
import { getClientIp } from '@/lib/rate-limit';
import { updateProfileSchema, onboardingSchema } from '@/lib/validators/auth';
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/cookies';
import { revokeRefreshToken } from '@/lib/auth/session';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { ensureSubscription } from '@/lib/subscription';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireCurrentUser(request);
    const body = parseBody(updateProfileSchema, await request.json());

    const user = await db.user.update({
      where: { id: currentUser.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      },
    });

    await createAuditLog({
      userId: user.id,
      action: AuditActions.PROFILE_UPDATE,
      resource: 'users/me',
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({ user: toSafeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await requireCurrentUser(request);
    const body = parseBody(onboardingSchema, await request.json());

    const user = await db.user.update({
      where: { id: currentUser.id },
      data: {
        name: body.name,
        avatarUrl: body.avatarUrl ?? null,
        onboardingCompleted: true,
      },
    });

    await db.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: body.name,
      },
      update: {
        displayName: body.name,
      },
    });

    await ensureSubscription(user.id);

    await createAuditLog({
      userId: user.id,
      action: AuditActions.ONBOARDING_COMPLETE,
      resource: 'onboarding',
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({ user: toSafeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request);

    const refreshToken = await getRefreshTokenFromCookies();
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload.jti) await revokeRefreshToken(payload.jti);
      } catch {
        // continue
      }
    }

    await db.user.delete({ where: { id: user.id } });
    await clearAuthCookies();

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
