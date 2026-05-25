import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import { getEnv } from '@/lib/env';

export type TokenType = 'access' | 'refresh';

export type TokenPayload = JWTPayload & {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
  type: TokenType;
  jti?: string;
};

function accessSecret() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

function refreshSecret() {
  return new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match?.[1] || !match[2]) return 900;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
}

type SignPayload = {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export async function signAccessToken(payload: SignPayload): Promise<string> {
  const env = getEnv();
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(accessSecret());
}

export async function signRefreshToken(
  payload: SignPayload,
  familyId?: string,
): Promise<{ token: string; tokenId: string }> {
  const env = getEnv();
  const tokenId = randomUUID();
  const claims: Record<string, unknown> = { ...payload, type: 'refresh', jti: tokenId };
  if (familyId) claims.familyId = familyId;
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(tokenId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecret());

  return { token, tokenId };
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret());
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret());
  if (payload.type !== 'refresh' || !payload.jti) {
    throw new Error('Invalid token type');
  }
  return payload as TokenPayload;
}

export function getAccessTokenMaxAge(): number {
  return parseDuration(getEnv().JWT_EXPIRES_IN);
}

export function getRefreshTokenMaxAge(): number {
  return parseDuration(getEnv().JWT_REFRESH_EXPIRES_IN);
}
