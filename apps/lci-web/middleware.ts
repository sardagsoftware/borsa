/**
 * i18n Middleware - Locale-based routing for LyDian AI
 * Automatically redirects root requests to default locale (tr)
 * Supports: Turkish (tr), English (en)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isValidLocale } from './src/lib/i18n';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip API routes, _next, static files, and special routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/health') ||
    pathname.startsWith('/status') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get first path segment (potential locale)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  // If first segment is a valid locale, continue
  if (firstSegment && isValidLocale(firstSegment)) {
    return NextResponse.next();
  }

  // No valid locale found - redirect to default locale
  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Match all paths except:
    // - API routes
    // - Static files (_next, images, etc.)
    // - Special Next.js files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|health|status).*)',
  ],
};
