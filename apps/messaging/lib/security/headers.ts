/**
 * SHARD_12.1 - Security Headers
 * Comprehensive security headers for defense in depth
 *
 * Security: CSP, HSTS, XSS protection, clickjacking prevention
 * White Hat: Industry standard security practices
 */

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'Strict-Transport-Security': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
}

/**
 * Generate Content Security Policy
 */
export function generateCSP(nonce?: string): string {
  const directives = [
    // Default: only same origin
    "default-src 'self'",

    // Scripts: self + nonce (no unsafe-inline in prod)
    nonce ? `script-src 'self' 'nonce-${nonce}'` : "script-src 'self' 'unsafe-inline'",

    // Styles: self + inline for Tailwind
    "style-src 'self' 'unsafe-inline'",

    // Images: self + data URIs + https
    "img-src 'self' data: https:",

    // Fonts: self + data
    "font-src 'self' data:",

    // Connect: self + WebSocket
    "connect-src 'self' ws: wss:",

    // Media: self
    "media-src 'self'",

    // Objects: none (no Flash, Java)
    "object-src 'none'",

    // Base: none (prevent base tag injection)
    "base-uri 'none'",

    // Forms: self
    "form-action 'self'",

    // Frame ancestors: none (clickjacking prevention)
    "frame-ancestors 'none'",

    // Worker: self
    "worker-src 'self'",

    // Manifest: self
    "manifest-src 'self'",

    // Upgrade insecure requests
    "upgrade-insecure-requests"
  ];

  return directives.join('; ');
}

/**
 * Get all security headers
 */
export function getSecurityHeaders(nonce?: string): SecurityHeaders {
  return {
    // Content Security Policy
    'Content-Security-Policy': generateCSP(nonce),

    // HSTS: Force HTTPS for 2 years, include subdomains
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // Clickjacking prevention
    'X-Frame-Options': 'DENY',

    // XSS protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy: no referrer for cross-origin
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy: disable unnecessary features
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=(self)',
      'geolocation=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=(self)',
      'payment=()',
      'usb=()'
    ].join(', '),

    // COEP: require corp for all resources
    'Cross-Origin-Embedder-Policy': 'require-corp',

    // COOP: isolate browsing context
    'Cross-Origin-Opener-Policy': 'same-origin',

    // CORP: same-origin
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers, nonce?: string): void {
  const securityHeaders = getSecurityHeaders(nonce);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Generate nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Validate CSP
 */
export function validateCSP(csp: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for unsafe-inline in production
  if (process.env.NODE_ENV === 'production' && csp.includes("'unsafe-inline'")) {
    errors.push("Production CSP should not contain 'unsafe-inline' for scripts");
  }

  // Check for unsafe-eval
  if (csp.includes("'unsafe-eval'")) {
    errors.push("CSP should not contain 'unsafe-eval'");
  }

  // Check for upgrade-insecure-requests
  if (!csp.includes('upgrade-insecure-requests')) {
    errors.push("CSP should include 'upgrade-insecure-requests'");
  }

  // Check for frame-ancestors
  if (!csp.includes('frame-ancestors')) {
    errors.push("CSP should include 'frame-ancestors' for clickjacking prevention");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check security headers
 */
export function checkSecurityHeaders(headers: Record<string, string>): {
  score: number;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const requiredHeaders = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy'
  ];

  // Check required headers
  requiredHeaders.forEach((header) => {
    if (headers[header]) {
      score += 20;
    } else {
      missing.push(header);
    }
  });

  // Check HSTS strength
  const hsts = headers['Strict-Transport-Security'];
  if (hsts) {
    if (!hsts.includes('includeSubDomains')) {
      warnings.push('HSTS should include subdomains');
      score -= 5;
    }
    if (!hsts.includes('preload')) {
      warnings.push('HSTS should include preload');
      score -= 5;
    }
  }

  // Check CSP
  const csp = headers['Content-Security-Policy'];
  if (csp) {
    const validation = validateCSP(csp);
    if (!validation.valid) {
      warnings.push(...validation.errors);
      score -= validation.errors.length * 5;
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    missing,
    warnings
  };
}
