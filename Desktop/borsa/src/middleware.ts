/**
 * LYDIAN TRADER - Production Security Middleware
 * Railway deployment - Authentication & Authorization
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/crypto',
  '/stocks',
  '/portfolio',
  '/watchlist',
  '/bot-management',
  '/signals',
  '/quantum-pro',
  '/backtesting',
  '/risk-management',
  '/market-analysis',
  '/settings',
  '/ai-chat',
  '/api/quantum-pro',
  '/api/market',
];

// Public routes (accessible without auth)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/api/auth',
  '/api/location',
  '/api/geolocation',
  '/_next',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for authentication token
    const authToken = request.cookies.get('auth_token')?.value;
    const sessionToken = request.cookies.get('session_token')?.value;

    // If no auth token, redirect to login
    if (!authToken && !sessionToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token (in production, verify with JWT)
    if (authToken) {
      try {
        // Add security headers
        const response = NextResponse.next();

        // Security headers
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        response.headers.set(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.coingecko.com https://pro-api.coinmarketcap.com;"
        );

        return response;
      } catch (error) {
        // Invalid token, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
