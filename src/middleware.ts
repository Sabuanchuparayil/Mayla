import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { COOKIE_NAMES } from '@/lib/constants';

const isDev = process.env.NODE_ENV !== 'production';

function buildCsp(nonce: string): string {
  const directives = [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'self'",
  ];
  return directives.join('; ');
}

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/verify',
  '/forgot-password',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/auth/forgot-password',
  '/api/auth/logout',
  '/api/auth/socket-token',
  '/api/health',
  '/api/webhooks/stripe',
  '/manifest.webmanifest',
  '/sw.js',
];

const authPaths = ['/login', '/signup', '/verify'];

function isSafeRedirect(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/verify') return true;
  return publicPaths
    .filter((path) => path !== '/verify')
    .some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPath(pathname: string): boolean {
  return authPaths.includes(pathname);
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function isProtectedPage(pathname: string): boolean {
  return [
    '/dashboard',
    '/discover',
    '/nearby',
    '/chat',
    '/profile',
    '/settings',
    '/onboarding',
    '/verify/selfie',
    '/admin',
  ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function withPathname(response: NextResponse, pathname: string) {
  response.headers.set('x-pathname', pathname);
  return response;
}

async function verifyAccessTokenEdge(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  function applyHeaders(response: NextResponse): NextResponse {
    response.headers.set('x-nonce', nonce);
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }

  const accessToken =
    request.cookies.get(COOKIE_NAMES.accessToken)?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');
  const session = accessToken ? await verifyAccessTokenEdge(accessToken) : null;

  const method = request.method;
  if (isApiPath(pathname) && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = request.headers.get('origin');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (origin && appUrl && !origin.startsWith(appUrl)) {
      return applyHeaders(
        withPathname(
          NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Invalid origin' } },
            { status: 403 },
          ),
          pathname,
        ),
      );
    }
  }

  if (isPublicPath(pathname)) {
    if (session && isAuthPath(pathname)) {
      const raw = request.nextUrl.searchParams.get('redirect') ?? '/dashboard';
      const redirect = isSafeRedirect(raw) ? raw : '/dashboard';
      return applyHeaders(
        withPathname(NextResponse.redirect(new URL(redirect, request.url)), pathname),
      );
    }
    return applyHeaders(
      withPathname(
        NextResponse.next({ request: { headers: requestHeaders } }),
        pathname,
      ),
    );
  }

  if (!session) {
    if (isApiPath(pathname)) {
      return applyHeaders(
        withPathname(
          NextResponse.json(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 },
          ),
          pathname,
        ),
      );
    }
    if (isProtectedPage(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return applyHeaders(
        withPathname(NextResponse.redirect(loginUrl), pathname),
      );
    }
  }

  if (session && pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return applyHeaders(
      withPathname(NextResponse.redirect(new URL('/dashboard', request.url)), pathname),
    );
  }

  return applyHeaders(
    withPathname(
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname,
    ),
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
