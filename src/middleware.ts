import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth/session';

// Routes that require authentication
const PROTECTED_ROUTES = ['/app', '/onboarding'];
// Routes that should redirect to app if already authenticated
const AUTH_ROUTES = ['/login', '/'];
// API routes that require authentication
const PROTECTED_API_ROUTES = ['/api/profile', '/api/discovery', '/api/matches', '/api/chat', '/api/events', '/api/payments', '/api/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route);
  const isProtectedApi = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));

  const session = await verifySessionFromRequest(request);

  // Protect routes
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  // Protect API routes
  if (isProtectedApi && !session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/app/:path*',
    '/onboarding/:path*',
    '/api/profile/:path*',
    '/api/discovery/:path*',
    '/api/matches/:path*',
    '/api/chat/:path*',
    '/api/events/:path*',
    '/api/payments/:path*',
    '/api/settings/:path*',
  ],
};
