/**
 * Public auth API — JWT, sessions, guards.
 * Implementation details live in src/lib/auth/* modules.
 */
export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenMaxAge,
  getRefreshTokenMaxAge,
  type TokenPayload,
} from '@/lib/auth/jwt';

export { hashPassword, verifyPassword } from '@/lib/auth/password';
export { setAuthCookies, clearAuthCookies, getAccessTokenFromCookies, getRefreshTokenFromCookies } from '@/lib/auth/cookies';
export { storeRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens } from '@/lib/auth/session';
export { registerUser, loginUser, issueTokens } from '@/lib/auth/service';
export { createAuditLog, AuditActions } from '@/lib/auth/audit';
export {
  getSessionFromRequest,
  requireSession,
  requireAdmin,
  getCurrentUser,
  requireCurrentUser,
} from '@/lib/auth/guard';
export { getServerUser, requireServerUser, requireOnboardingComplete } from '@/lib/auth/server';
