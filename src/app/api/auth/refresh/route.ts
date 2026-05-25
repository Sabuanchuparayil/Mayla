export const dynamic = 'force-dynamic';

import { handleApiError, AppError, ErrorCodes } from '@/lib/api/errors';
import { apiSuccess, toSafeUser } from '@/lib/api/response';
import { setAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/cookies';
import { createAuditLog, AuditActions } from '@/lib/auth/audit';
import { issueTokens } from '@/lib/auth/service';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import {
  getStoredRefreshToken,
  revokeRefreshToken,
  revokeTokenFamily,
} from '@/lib/auth/session';
import { db } from '@/lib/db';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    await rateLimit(`auth:refresh:${ip}`, 30, 900);

    const cookieToken = await getRefreshTokenFromCookies();
    let refreshToken = cookieToken;

    if (!refreshToken) {
      try {
        const body = (await request.json()) as { refreshToken?: string };
        refreshToken = body.refreshToken;
      } catch {
        // no body
      }
    }

    if (!refreshToken) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Refresh token required', 401);
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload.jti || !payload.sub) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
    }

    const stored = await getStoredRefreshToken(payload.jti);

    if (!stored) {
      const jwtFamilyId = (payload as Record<string, unknown>).familyId as string | undefined;
      if (jwtFamilyId) {
        await revokeTokenFamily(jwtFamilyId);
      }
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Refresh token revoked or expired', 401);
    }

    if (stored.userId !== payload.sub) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Refresh token revoked or expired', 401);
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not found', 401);
    }

    await revokeRefreshToken(payload.jti);

    const identifier = user.email ?? user.phone ?? user.id;
    const tokens = await issueTokens(user.id, identifier, user.role, stored.familyId);
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    await createAuditLog({
      userId: user.id,
      action: AuditActions.TOKEN_REFRESH,
      ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return apiSuccess({ user: toSafeUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
