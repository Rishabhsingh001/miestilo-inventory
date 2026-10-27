import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const COOKIE_NAME = 'misterio_session';
const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'miestilo-production-luxury-secret-key-9990642820-sajid-khan'
);

const PUBLIC_PATHS = [
  '/login',
  '/api/v1/auth/login',
  '/api/v1/health',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through static assets and media
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/products') ||
    pathname.startsWith('/catalog')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secretKey);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Already logged in? Don't allow staying on /login
  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Public endpoints
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path);
  if (isPublic) {
    return NextResponse.next();
  }

  // Block unauthenticated access
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Please sign in.',
            details: [],
          },
        },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/' && pathname !== '/dashboard') {
      loginUrl.searchParams.set('returnUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user accessing root '/' -> send to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|products/|catalog/).*)',
  ],
};
