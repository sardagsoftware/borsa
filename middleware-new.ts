import { NextRequest, NextResponse } from "next/server";
import { chooseVariant, type Variant } from "./lib/ab/assign";
import { getSecurityHeaders } from "./lib/security/csp";
import { apiRateLimit, aiRateLimit, tradeRateLimit, authRateLimit } from './lib/middleware/rate-limit';
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

// Create i18n middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting for API routes first
  if (pathname.startsWith('/api/')) {
    let rateLimitResult;
    if (pathname.startsWith('/api/ai/')) {
      rateLimitResult = aiRateLimit.check(request);
    } else if (pathname.startsWith('/api/trade/')) {
      rateLimitResult = tradeRateLimit.check(request);
    } else if (pathname.startsWith('/api/auth/')) {
      rateLimitResult = authRateLimit.check(request);
    } else {
      rateLimitResult = apiRateLimit.check(request);
    }

    // Return rate limit response if exceeded
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          }
        }
      );
      
      // Add security headers even to rate limit responses
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      
      return rateLimitResponse;
    }
  }

  // First handle internationalization
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returned a response (redirect), use it
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse;
  }

  // Continue with A/B testing and security logic
  const response = intlResponse || NextResponse.next();
  
  // Apply Security Headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add mobile-specific performance headers
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('Mobile')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Service-Worker-Allowed', '/');
    response.headers.set('X-Mobile-Optimized', 'true');
  }

  // Ownership banner injection for HTML responses
  if (request.headers.get('accept')?.includes('text/html')) {
    const ownershipBanner = `
    <!-- 
    ⚖️ AILYDIAN AI LENS PRO CRYPTO TRADER - ULTRA SECURITY
    © 2024 Emrah Şardağ. All Rights Reserved.
    Unauthorized reproduction, distribution, or reverse engineering is strictly prohibited.
    This software is protected by copyright laws and international treaties.
    -->`;
    
    response.headers.set('x-ownership-banner', 'injected');
  }
  
  // A/B Test Variant Cookie Management
  const abVariant = request.cookies.get("ab-variant")?.value as Variant | undefined;
  
  if (!abVariant) {
    // New user - assign A/B variant
    const variant = chooseVariant(request.headers);
    
    // Set cookie for 30 days
    response.cookies.set("ab-variant", variant, {
      httpOnly: false, // Client-side access needed for theme switching
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    
    // Add variant to response headers for server-side access
    response.headers.set("x-ab-variant", variant);
  } else {
    // Existing user - pass along variant
    response.headers.set("x-ab-variant", abVariant);
  }
  
  // Add market volatility header (placeholder - would come from real market data)
  // This could be fetched from Redis cache or external API
  const mockVolatility = Math.random() * 0.5; // 0-50% volatility for demo
  response.headers.set("x-market-volatility", mockVolatility.toString());
  
  // Add locale to headers for server-side access
  const locale = request.nextUrl.pathname.split('/')[1] || 'tr';
  if (['tr', 'en', 'ar', 'fa', 'fr', 'de', 'nl'].includes(locale)) {
    response.headers.set("x-locale", locale);
  } else {
    response.headers.set("x-locale", 'tr');
  }
  
  return response;
}

export const config = {
  // Match internationalized pathnames and A/B testing paths
  matcher: [
    '/',
    '/(tr|en|ar|fa|fr|de|nl)/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
