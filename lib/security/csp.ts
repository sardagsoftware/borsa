/**
 * 🛡️ AILYDIAN AI LENS TRADER - Content Security Policy
 * CSP/COOP/COEP/Permissions-Policy başlıkları (nonce strict-dynamic)
 * © Emrah Şardağ. All rights reserved.
 */

import { headers } from 'next/headers';

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Resource-Policy': string;
  'Permissions-Policy': string;
  'Referrer-Policy': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'Strict-Transport-Security': string;
}

export function generateNonce(): string {
  // Use Web Crypto API for edge runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).slice(0, 16);
  }
  
  // Fallback for older environments
  return Math.random().toString(36).substring(2, 18);
}

export function buildCSP(nonce?: string): string {
  const n = nonce || generateNonce();
  const isDev = process.env.NODE_ENV === 'development';
  
  // Development mode: Allow unsafe-eval for hot reload
  const scriptSrc = isDev 
    ? `script-src 'self' 'nonce-${n}' 'unsafe-eval' 'strict-dynamic' https://*.vercel-analytics.com https://*.vercel.app`
    : `script-src 'self' 'nonce-${n}' 'strict-dynamic' https://*.vercel-analytics.com https://*.vercel.app`;
  
  // More permissive connect-src for WalletConnect, Coinbase, and other wallet providers
  const connectSrc = [
    "'self'",
    "https://*.binance.com",
    "wss://*.binance.com",
    "https://api.coingecko.com",
    "https://*.ailydian.com",
    "https://*.vercel.app",
    // WalletConnect domains
    "https://*.walletconnect.org",
    "https://*.walletconnect.com",
    "wss://*.walletconnect.org",
    "wss://*.walletconnect.com",
    "https://pulse.walletconnect.org",
    "https://api.web3modal.org",
    // Coinbase domains
    "https://*.coinbase.com",
    "https://cca-lite.coinbase.com",
    // Other wallet providers
    "https://*.metamask.io",
    "https://*.trustwallet.com",
    // Development websockets
    ...(isDev ? ["ws://localhost:*", "wss://localhost:*"] : [])
  ].join(' ');
  
  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://*.binance.com https://*.coingecko.com https://*.ailydian.com https://*.walletconnect.org https://*.coinbase.com`,
    `connect-src ${connectSrc}`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']) // Skip upgrade in dev for localhost
  ].join('; ');
}

export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    'Content-Security-Policy': buildCSP(nonce),
    // More permissive COOP for wallet connections in development
    'Cross-Origin-Opener-Policy': isDev ? 'unsafe-none' : 'same-origin',
    // Disable COEP in development for wallet analytics
    'Cross-Origin-Embedder-Policy': isDev ? 'unsafe-none' : 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-site',
    'Permissions-Policy': [
      'fullscreen=(self)',
      'microphone=()',
      'camera=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'bluetooth=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'picture-in-picture=()',
      'display-capture=()',
      'web-share=(self)'
    ].join(', '),
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'X-XSS-Protection': '1; mode=block',
    // Feature Policy (legacy support)
    'Feature-Policy': [
      'geolocation \'none\'',
      'microphone \'none\'',
      'camera \'none\'',
      'magnetometer \'none\'',
      'gyroscope \'none\'',
      'speaker \'self\'',
      'vibrate \'self\'',
      'fullscreen \'self\'',
      'payment \'none\''
    ].join('; ')
  };
}

export function getRequestNonce(): string | null {
  try {
    const headersList = headers();
    return headersList.get('x-nonce') || null;
  } catch {
    return null;
  }
}
