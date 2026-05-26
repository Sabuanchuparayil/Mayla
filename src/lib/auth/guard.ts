import { db } from '@/lib/db';
import { verifyAccessToken, type TokenPayload } from '@/lib/auth/jwt';
import { getAccessTokenFromCookies } from '@/lib/auth/cookies';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { toSafeUser, type SafeUser } from '@/lib/api/response';

export async function getSessionFromRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = (await getAccessTokenFromCookies()) ?? undefined;
  }

  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(request: Request): Promise<TokenPayload> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
  }
  return session;
}

export async function requireAdmin(request: Request): Promise<TokenPayload> {
  const session = await requireSession(request);
  if (session.role !== 'ADMIN') {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Admin access required', 403);
  }
  return session;
}

export async function getCurrentUser(request: Request): Promise<SafeUser | null> {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) return null;

  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user) return null;

  if (user.suspendedAt) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Account suspended', 403);
  }

  return toSafeUser(user);
}

export async function requireCurrentUser(request: Request): Promise<SafeUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
  }
  return user;
}
