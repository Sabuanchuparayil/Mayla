export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/api/errors';
import { apiSuccess } from '@/lib/api/response';
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/cookies';
import { createAuditLog, AuditActions } from '@/lib/auth/audit';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { revokeRefreshToken } from '@/lib/auth/session';
import { getClientIp } from '@/lib/rate-limit';
import { requireSession } from '@/lib/auth/guard';

export async function POST(request: Request) {
  try {
    const session = await requireSession(request).catch(() => null);
    const refreshToken = (await getRefreshTokenFromCookies()) ?? undefined;

    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload.jti) {
          await revokeRefreshToken(payload.jti);
        }
      } catch {
        // Token already invalid — continue clearing cookies
      }
    }

    await clearAuthCookies();

    if (session?.sub) {
      await createAuditLog({
        userId: session.sub,
        action: AuditActions.USER_LOGOUT,
        ip: getClientIp(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    }

    return apiSuccess({ message: 'Logged out successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
