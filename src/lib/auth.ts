import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const encoder = new TextEncoder();
const ACCESS_SECRET = encoder.encode(process.env.JWT_SECRET ?? 'change-me-access');
const REFRESH_SECRET = encoder.encode(process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh');

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '30d';

export interface AuthPayload extends JWTPayload {
  userId: string;
  role: string;
}

export interface RefreshPayload extends JWTPayload {
  userId: string;
}

// ─── Token generation ─────────────────────────────────────────────────────────────────────────────

export async function generateAccessToken(userId: string, role: string): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(ACCESS_SECRET);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(REFRESH_SECRET);
}

export async function generateTokenPair(
  userId: string,
  role: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, role),
    generateRefreshToken(userId),
  ]);
  return { accessToken, refreshToken };
}

// ─── Token verification ───────────────────────────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as AuthPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as RefreshPayload;
}

// ─── Request helpers ────────────────────────────────────────────────────────────────────────────

export function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function getAuthPayload(req: NextRequest): Promise<AuthPayload | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

// ─── Route wrappers ────────────────────────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<Record<string, string>> };
type AuthContext = RouteContext & { auth: AuthPayload };
type AuthHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;
type RouteHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>;

export function withAuth(handler: AuthHandler): RouteHandler {
  return async (req, ctx) => {
    const auth = await getAuthPayload(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return handler(req, { ...ctx, auth });
  };
}

export function withAdmin(handler: AuthHandler): RouteHandler {
  return async (req, ctx) => {
    const auth = await getAuthPayload(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return handler(req, { ...ctx, auth });
  };
}
