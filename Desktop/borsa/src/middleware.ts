import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security: Request tracking and logging
interface RequestLog {
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  timestamp: number;
  geo?: string;
}

const requestLogs: RequestLog[] = [];
const MAX_LOGS = 10000;

function logRequest(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const geo = request.headers.get('x-vercel-ip-country') || 'unknown';

  const log: RequestLog = {
    ip,
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: Date.now(),
    geo
  };

  requestLogs.push(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift();
  }

  // Security: Detect suspicious patterns
  const recentRequests = requestLogs.filter(
    l => l.ip === ip && Date.now() - l.timestamp < 60000
  );

  if (recentRequests.length > 100) {
    console.warn(`[SECURITY] Potential abuse detected from IP: ${ip}`);
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('lydian-auth');

  // Log all requests for security monitoring
  logRequest(request);

  // Public pages that don't require authentication
  const publicPages = ['/login'];

  // Security Headers
  const response = publicPages.includes(pathname)
    ? NextResponse.next()
    : authCookie
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/login', request.url));

  // Add comprehensive security headers
  const headers = response.headers;

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // XSS Protection
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HTTPS only)
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  // Content Security Policy - Ultra strict
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.ailydian.com https://vercel.live https://*.vercel.app wss://*.vercel.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Remove server information
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};