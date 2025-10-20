/**
 * 🌍 Environment Utilities
 * Helper functions for environment detection
 *
 * @module lib/env-utils
 * @white-hat Compliant
 */

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'preview' | 'test';

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
  // Check browser environment
  if (typeof window !== 'undefined') {
    // Check hostname
    const hostname = window.location.hostname;

    // Production domains
    if (
      hostname === 'ailydian.com' ||
      hostname === 'www.ailydian.com' ||
      hostname.endsWith('.ailydian.com')
    ) {
      return 'production';
    }

    // Vercel preview
    if (hostname.includes('vercel.app')) {
      return 'preview';
    }

    // Localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
  }

  // Check process.env (SSR/Node)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VERCEL_ENV === 'production') return 'production';
    if (process.env.VERCEL_ENV === 'preview') return 'preview';
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'test') return 'test';
  }

  // Default to development
  return 'development';
}

/**
 * Check if production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if preview environment (Vercel preview)
 */
export function isPreview(): boolean {
  return getEnvironment() === 'preview';
}

/**
 * Check if test environment
 */
export function isTest(): boolean {
  return getEnvironment() === 'test';
}

/**
 * Check if demo routes are enabled
 */
export function isDemoRoutesEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ENABLE_DEMO_ROUTES === 'true';
  }
  return false;
}

/**
 * Demo routes list (matches backend)
 */
export const DEMO_ROUTES = [
  // Test pages
  '/test-auto-translate.html',
  '/test-chat-api.html',
  '/test-i18n-demo.html',
  '/test-language-system.html',
  '/test-legal.html',
  '/test-translation.html',

  // Demo pages
  '/cyborg-demo.html',
  '/hero-cinematic-demo.html',
  '/realistic-characters-demo.html',

  // Old/backup pages
  '/dashboard-old.html',
  '/index-new.html',

  // Development dashboards
  '/cache-dashboard.html',
  '/email-dashboard.html',
  '/performance-dashboard.html',
  '/security-analytics.html',
  '/seo-monitoring.html',
];

/**
 * Check if current route is a demo route
 */
export function isDemoRoute(pathname?: string): boolean {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');

  // Direct match
  if (DEMO_ROUTES.includes(path)) {
    return true;
  }

  // Pattern match
  const patterns = [
    /^\/test-.+\.html$/,
    /^\/demo-.+\.html$/,
    /^\/.*-demo\.html$/,
    /^\/.*-test\.html$/,
    /^\/.*-backup.*\.html$/,
    /^\/.*-old\.html$/,
  ];

  return patterns.some(pattern => pattern.test(path));
}

/**
 * Check if route should be blocked
 */
export function shouldBlockRoute(pathname?: string): boolean {
  // Allow in development
  if (isDevelopment()) {
    return false;
  }

  // Allow if demo mode enabled
  if (isDemoRoutesEnabled()) {
    return false;
  }

  // Block demo routes in production
  if (isProduction() && isDemoRoute(pathname)) {
    return true;
  }

  return false;
}

/**
 * Get environment display name
 */
export function getEnvironmentDisplay(): string {
  const env = getEnvironment();

  const displayMap: Record<Environment, string> = {
    development: 'Development',
    production: 'Production',
    preview: 'Preview',
    test: 'Test',
  };

  return displayMap[env];
}

/**
 * Get environment color (for badges)
 */
export function getEnvironmentColor(): string {
  const env = getEnvironment();

  const colorMap: Record<Environment, string> = {
    development: '#3498db', // Blue
    production: '#2ed573',  // Green
    preview: '#ff9f40',     // Orange
    test: '#9b59b6',        // Purple
  };

  return colorMap[env];
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(flag: string): boolean {
  if (typeof process !== 'undefined' && process.env) {
    const envVar = `ENABLE_${flag.toUpperCase()}`;
    return process.env[envVar] === 'true';
  }
  return false;
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    if (process.env.API_BASE_URL) {
      return process.env.API_BASE_URL;
    }
  }

  return 'http://localhost:3100';
}

/**
 * Log environment info (development only)
 */
export function logEnvironmentInfo(): void {
  if (!isDevelopment()) return;

  console.group('🌍 Environment Info');
  console.log('Environment:', getEnvironment());
  console.log('Is Production:', isProduction());
  console.log('Is Development:', isDevelopment());
  console.log('Is Preview:', isPreview());
  console.log('Demo Routes Enabled:', isDemoRoutesEnabled());
  console.log('API Base URL:', getApiBaseUrl());
  console.groupEnd();
}

/**
 * Environment-aware console log
 */
export function envLog(message: string, ...args: any[]): void {
  if (isDevelopment()) {
    console.log(`[${getEnvironment().toUpperCase()}]`, message, ...args);
  }
}

/**
 * Environment-aware console warn
 */
export function envWarn(message: string, ...args: any[]): void {
  if (isDevelopment() || isPreview()) {
    console.warn(`[${getEnvironment().toUpperCase()}]`, message, ...args);
  }
}

/**
 * Environment-aware console error (always logs)
 */
export function envError(message: string, ...args: any[]): void {
  console.error(`[${getEnvironment().toUpperCase()}]`, message, ...args);
}

console.log('✅ Environment utilities initialized');
