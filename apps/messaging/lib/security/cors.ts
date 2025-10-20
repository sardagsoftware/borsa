/**
 * SHARD_12.2 - CORS Configuration
 * Secure Cross-Origin Resource Sharing
 *
 * Security: Whitelist-based, credentials support
 * White Hat: Prevent unauthorized cross-origin access
 */

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

/**
 * Default CORS configuration
 */
const DEFAULT_CONFIG: CORSConfig = {
  allowedOrigins: [
    'http://localhost:3200',
    'http://localhost:3100',
    'https://messaging.ailydian.com',
    'https://ailydian.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Idempotency-Key'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours
  credentials: true
};

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string, config: CORSConfig = DEFAULT_CONFIG): boolean {
  // No origin (same-origin request)
  if (!origin) return true;

  // Check exact match
  if (config.allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns
  return config.allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    if (allowed.endsWith('*')) {
      const prefix = allowed.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Get CORS headers
 */
export function getCORSHeaders(
  origin: string,
  config: CORSConfig = DEFAULT_CONFIG
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Check if origin is allowed
  if (!isOriginAllowed(origin, config)) {
    return headers; // Return empty headers (CORS will fail)
  }

  // Allow origin (no wildcard with credentials)
  if (config.credentials) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = config.allowedOrigins.includes('*')
      ? '*'
      : origin;
  }

  // Allow credentials
  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  // Allow methods
  headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');

  // Allow headers
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');

  // Expose headers
  if (config.exposedHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  }

  // Max age for preflight cache
  headers['Access-Control-Max-Age'] = config.maxAge.toString();

  return headers;
}

/**
 * Handle preflight request
 */
export function handlePreflight(
  origin: string,
  method: string,
  requestHeaders: string,
  config: CORSConfig = DEFAULT_CONFIG
): { allowed: boolean; headers: Record<string, string> } {
  // Check origin
  if (!isOriginAllowed(origin, config)) {
    return { allowed: false, headers: {} };
  }

  // Check method
  if (!config.allowedMethods.includes(method.toUpperCase())) {
    return { allowed: false, headers: {} };
  }

  // Check headers
  const reqHeaders = requestHeaders.split(',').map((h) => h.trim().toLowerCase());
  const allowedHeadersLower = config.allowedHeaders.map((h) => h.toLowerCase());

  const hasDisallowedHeader = reqHeaders.some(
    (h) => !allowedHeadersLower.includes(h)
  );

  if (hasDisallowedHeader) {
    return { allowed: false, headers: {} };
  }

  // Return CORS headers
  return {
    allowed: true,
    headers: getCORSHeaders(origin, config)
  };
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  headers: Headers,
  origin: string,
  config: CORSConfig = DEFAULT_CONFIG
): void {
  const corsHeaders = getCORSHeaders(origin, config);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Validate CORS configuration
 */
export function validateCORSConfig(config: CORSConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check wildcard with credentials
  if (config.allowedOrigins.includes('*') && config.credentials) {
    errors.push('Cannot use wildcard origin (*) with credentials');
  }

  // Check empty origins
  if (config.allowedOrigins.length === 0) {
    errors.push('At least one origin must be allowed');
  }

  // Check methods
  if (config.allowedMethods.length === 0) {
    errors.push('At least one method must be allowed');
  }

  // Check for dangerous methods in production
  if (process.env.NODE_ENV === 'production') {
    if (config.allowedMethods.includes('TRACE')) {
      errors.push('TRACE method should not be allowed in production');
    }
    if (config.allowedMethods.includes('CONNECT')) {
      errors.push('CONNECT method should not be allowed');
    }
  }

  // Check localhost in production
  if (process.env.NODE_ENV === 'production') {
    const hasLocalhost = config.allowedOrigins.some((origin) =>
      origin.includes('localhost') || origin.includes('127.0.0.1')
    );
    if (hasLocalhost) {
      errors.push('Localhost origins should not be allowed in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get production CORS config
 */
export function getProductionCORSConfig(): CORSConfig {
  return {
    allowedOrigins: [
      'https://messaging.ailydian.com',
      'https://ailydian.com',
      'https://www.ailydian.com'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Idempotency-Key'
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    maxAge: 86400,
    credentials: true
  };
}

/**
 * Get development CORS config
 */
export function getDevelopmentCORSConfig(): CORSConfig {
  return {
    allowedOrigins: [
      'http://localhost:3200',
      'http://localhost:3100',
      'http://localhost:3000'
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['*'],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    maxAge: 3600,
    credentials: true
  };
}

/**
 * Get CORS config based on environment
 */
export function getCORSConfig(): CORSConfig {
  return process.env.NODE_ENV === 'production'
    ? getProductionCORSConfig()
    : getDevelopmentCORSConfig();
}
