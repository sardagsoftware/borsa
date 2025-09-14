/**
 * 🛡️ AILYDIAN AI LENS TRADER - Security Headers
 * HSTS, CORP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options deny
 * © Emrah Şardağ. All rights reserved.
 */

import { NextResponse } from 'next/server';
import { getSecurityHeaders } from './csp';

export function applySecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  const securityHeaders = getSecurityHeaders(nonce);
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Additional security headers
  response.headers.set('X-Powered-By', 'AILYDIAN AI LENS');
  response.headers.set('Server', 'AILYDIAN');
  
  // Copyright notice in headers
  response.headers.set('X-Copyright', process.env.OWNERSHIP_COPYRIGHT || '(c) 2024-2025 Emrah Sardag - AILYDIAN');
  
  return response;
}

export function getApiSecurityHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://borsa.ailydian.com' 
      : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'X-Copyright': process.env.OWNERSHIP_COPYRIGHT || '(c) 2024-2025 Emrah Sardag - AILYDIAN'
  };
}

export function createSecureApiResponse(data: any, status = 200): Response {
  const headers = getApiSecurityHeaders();
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export const SECURITY_HEADERS_MIDDLEWARE = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Clear-Site-Data': '"cache", "cookies", "storage"', // Only on logout
  'Feature-Policy': "geolocation 'none'; microphone 'none'; camera 'none'",
  'X-Copyright': process.env.OWNERSHIP_COPYRIGHT || '(c) 2024-2025 Emrah Sardag - AILYDIAN'
} as const;
