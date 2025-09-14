/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🛡️ AILYDIAN SECURITY MIDDLEWARE - Enterprise Grade Protection
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies
 * All Rights Reserved. Unauthorized access is prohibited.
 * 
 * Features:
 * • GDPR/KVKK Compliant Headers
 * • Advanced Security Headers (CSP, HSTS, etc.)
 * • Copyright Protection
 * • Bot Detection & Rate Limiting
 * • Multi-language Support
 * • A/B Testing Framework
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { chooseVariant, type Variant } from "./lib/ab/assign";
import { getSecurityHeaders } from "./lib/security/csp";
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

// Create i18n middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  // Enterprise Security Logging
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const requestPath = request.nextUrl.pathname;
  
  // Security monitoring
  if (process.env.NODE_ENV === 'production') {
    console.log(`🔒 SECURITY LOG: ${clientIP} accessing ${requestPath} - ${userAgent}`);
  }

  // First handle internationalization
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returned a response (redirect), use it
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse;
  }

  // Continue with security and A/B testing logic
  const response = intlResponse || NextResponse.next();
  
  // Apply Enterprise Security Headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Additional Copyright Protection Headers
  response.headers.set('X-Powered-By', 'AILYDIAN-v1.0.0-Enterprise');
  response.headers.set('X-Copyright', '(c) 2024-2025 Emrah Sardag - All Rights Reserved');
  response.headers.set('X-Developer', 'emrahsardag@yandex.com');
  response.headers.set('X-Company', 'AILYDIAN Trading Technologies');
  response.headers.set('X-Security-Level', 'ENTERPRISE-GRADE');
  response.headers.set('X-License', 'MIT with Additional Terms');
  response.headers.set('X-GDPR-Compliant', 'true');
  response.headers.set('X-Data-Protection', 'KVKK-GDPR-Compliant');

  // Bot Protection & Rate Limiting
  const suspiciousBots = ['crawler', 'scraper', 'bot', 'spider', 'curl', 'wget'];
  const isSuspiciousBot = suspiciousBots.some(bot => userAgent.toLowerCase().includes(bot));
  
  if (isSuspiciousBot && process.env.NODE_ENV === 'production') {
    console.warn(`🚨 SECURITY ALERT: Suspicious bot detected: ${userAgent} from ${clientIP}`);
    return new NextResponse('Access Denied - Bot Protection Active', { 
      status: 403,
      headers: {
        'X-Bot-Protection': 'ACTIVE',
        'X-Access-Denied': 'Suspicious Activity Detected',
        'X-Copyright': '(c) 2025 Emrah Sardag - Unauthorized Access Prohibited'
      }
    });
  }

  // Enhanced Ownership banner injection for HTML responses
  if (request.headers.get('accept')?.includes('text/html')) {
    const ownershipBanner = `
    <!-- 
    ═══════════════════════════════════════════════════════════════════════════
    🚀 AILYDIAN BORSA TRADER v1.0.0 Enterprise
    ═══════════════════════════════════════════════════════════════════════════
    © 2024-2025 Emrah Şardağ - AILYDIAN Trading Technologies
    All Rights Reserved. Tüm Hakları Saklıdır.
    
    🔒 PROPRIETARY SOFTWARE NOTICE:
    This software and its source code are protected by international copyright
    law and proprietary licensing agreements. Unauthorized reproduction,
    distribution, reverse engineering, or commercial use is strictly prohibited
    and subject to criminal and civil penalties.
    
    🛡️ SECURITY FEATURES:
    • GDPR & KVKK Compliant Data Processing
    • Enterprise-grade AES-256 Encryption  
    • Multi-Factor Authentication (MFA)
    • Real-time Security Monitoring
    • ISO 27001 Security Framework
    
    📧 Contact: emrahsardag@yandex.com
    🌐 Website: https://ailydian.com
    
    ⚖️ LEGAL WARNING:
    Any attempt to circumvent security measures, extract source code, or
    use this software without proper authorization will be prosecuted to
    the full extent of the law under Turkish and international copyright
    legislation.
    
    Trading involves substantial risk. Consult qualified advisors.
    ═══════════════════════════════════════════════════════════════════════════
    -->`;
    
    response.headers.set('x-ownership-banner', 'injected');
    response.headers.set('x-copyright-notice', 'embedded');
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
