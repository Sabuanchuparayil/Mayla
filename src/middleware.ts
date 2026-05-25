import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-access',
);

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/api/profile', '/api/matches', '/api/swipes', '/api/user',
  '/api/messages', '/api/reports', '/api/blocks', '/api/media',
  '/api/discovery', '/api/admin', '/api/verification',
];

// Routes that are always public (no auth check)
const PUBLIC_PREFIXES = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/public',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();
  if (!isProtected(pathname)) return NextResponse.next();

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    const userId = payload['userId'] as string | undefined;
    const role = payload['role'] as string | undefined;

    if (!userId) throw new Error('Missing userId in token');

    // Forward identity to route handlers via headers
    const headers = new Headers(req.headers);
    headers.set('x-user-id', userId);
    headers.set('x-user-role', role ?? 'USER');

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
