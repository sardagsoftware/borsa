import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Şifre (Production'da environment variable kullanılacak)
const CORRECT_PASSWORD = process.env.UKALAI_PASSWORD || 'Xruby1985.!?';

// Public paths (şifre gerektirmeyen)
const PUBLIC_PATHS = [
  '/api/health',
  '/manifest.webmanifest',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/_next',
  '/favicon.ico',
];

// Auth paths
const AUTH_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths - şifre gerektirmez
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Auth paths - şifre gerektirmez
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Session cookie kontrolü
  const sessionToken = request.cookies.get('ukalai_session')?.value;

  // Session var mı ve geçerli mi?
  if (sessionToken === btoa(CORRECT_PASSWORD)) {
    // Session geçerli, devam et
    return NextResponse.next();
  }

  // Session yok veya geçersiz - login'e yönlendir
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

// Middleware'in çalışacağı path'ler
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
