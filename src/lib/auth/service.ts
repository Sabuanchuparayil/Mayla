import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { storeRefreshToken } from '@/lib/auth/session';
import { setAuthCookies } from '@/lib/auth/cookies';
import { createAuditLog, AuditActions } from '@/lib/auth/audit';
import { AppError, ErrorCodes } from '@/lib/api/errors';
import { toSafeUser } from '@/lib/api/response';
import { normalizePhone, verifyOtp } from '@/lib/otp';
import type { LoginInput, SignupInput } from '@/lib/validators/auth';

type AuthMeta = { ip?: string; userAgent?: string };

function tokenSubject(user: { email?: string | null; phone?: string | null; id: string }): string {
  return user.email ?? user.phone ?? user.id;
}

export async function registerUser(input: SignupInput, meta: AuthMeta) {
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: input.email.toLowerCase() }, { username: input.username.toLowerCase() }],
    },
  });

  if (existing) {
    const field =
      existing.email?.toLowerCase() === input.email.toLowerCase() ? 'email' : 'username';
    throw new AppError(ErrorCodes.CONFLICT, `A user with this ${field} already exists`, 409);
  }

  const password = await hashPassword(input.password);
  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      password,
      name: input.name ?? null,
    },
  });

  await createAuditLog({
    userId: user.id,
    action: AuditActions.USER_SIGNUP,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { email: user.email },
  });

  const tokens = await issueTokens(user.id, tokenSubject(user), user.role);
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  return { user: toSafeUser(user), ...tokens };
}

export async function loginUser(input: LoginInput, meta: AuthMeta) {
  const user = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });

  if (!user?.password || !(await verifyPassword(input.password, user.password))) {
    await createAuditLog({
      action: AuditActions.USER_LOGIN_FAILED,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { email: input.email.toLowerCase() },
    });
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid email or password', 401);
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createAuditLog({
    userId: user.id,
    action: AuditActions.USER_LOGIN,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const tokens = await issueTokens(updated.id, tokenSubject(updated), updated.role);
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  return { user: toSafeUser(updated), ...tokens };
}

/** Phone OTP login — phoneVerified via OTP; selfie `verified` stays false until Rekognition. */
export async function loginWithPhone(phone: string, code: string, meta: AuthMeta) {
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid phone number', 422);
  }

  const valid = await verifyOtp(normalized, code);
  if (!valid) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid or expired OTP', 401);
  }

  let user = await db.user.findUnique({ where: { phone: normalized } });

  if (!user) {
    user = await db.user.create({
      data: { phone: normalized },
    });
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_SIGNUP,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { phone: normalized },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_LOGIN,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  }

  const tokens = await issueTokens(user.id, tokenSubject(user), user.role);
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);

  return { user: toSafeUser(user), ...tokens };
}

export async function issueTokens(userId: string, subject: string, role: 'USER' | 'ADMIN', familyId?: string) {
  const accessToken = await signAccessToken({ sub: userId, email: subject, role });
  const fid = familyId ?? crypto.randomUUID();
  const { token: refreshToken, tokenId } = await signRefreshToken({ sub: userId, email: subject, role }, fid);
  await storeRefreshToken(tokenId, userId, fid);
  return { accessToken, refreshToken, tokenId, familyId: fid };
}
