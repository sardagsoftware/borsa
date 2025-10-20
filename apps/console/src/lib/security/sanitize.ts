/**
 * 🔒 Security Sanitization Utilities
 *
 * White-hat security measures:
 * - XSS protection via HTML escaping
 * - SSRF protection via domain allowlist
 * - Input validation and sanitization
 * - KVKK/GDPR compliant data handling
 *
 * @module lib/security/sanitize
 * @white-hat Compliant
 */

// ============================================================================
// HTML Escaping (XSS Protection)
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
 * ```
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Unescape HTML entities back to characters
 * Use with caution - only on trusted content
 */
export function unescapeHtml(safe: string): string {
  if (typeof safe !== 'string') {
    return '';
  }

  return safe
    .replace(/&#x2F;/g, '/')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

/**
 * Strip all HTML tags from string
 * Useful for displaying user-generated content as plain text
 */
export function stripHtmlTags(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
    .replace(/<[^>]*>/g, '')                                             // Remove all tags
    .replace(/&nbsp;/g, ' ')                                             // Replace nbsp with space
    .trim();
}

// ============================================================================
// SSRF Protection
// ============================================================================

/**
 * SSRF Allowlist - Only allow requests to approved vendor domains
 * White-hat compliance: Official APIs only, NO scraping
 */
const SSRF_ALLOWLIST = [
  // Cargo tracking
  'aras.com.tr',
  'aras-kargo.com',
  'ups.com',
  'fedex.com',
  'yurtici kargo.com.tr',
  'mngkargo.com.tr',

  // E-commerce
  'trendyol.com',
  'hepsiburada.com',
  'n11.com',
  'amazon.com.tr',

  // Food delivery
  'yemeksepeti.com',
  'getir.com',
  'trendyolyemek.com',

  // Banking (must have partnership agreements)
  // Note: Add only after legal partnership established

  // AI/Data providers
  'openai.com',
  'anthropic.com',
  'googleapis.com',

  // Internal services
  'ailydian.com',
  'api.ailydian.com',
  'vercel.app',
];

/**
 * Check if URL is in SSRF allowlist
 *
 * @example
 * ```typescript
 * const safe = isAllowedDomain('https://trendyol.com/api/products');
 * // Result: true
 *
 * const unsafe = isAllowedDomain('https://malicious-site.com');
 * // Result: false
 * ```
 */
export function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    // Check if hostname matches or is subdomain of allowlist
    return SSRF_ALLOWLIST.some(domain => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Validate and sanitize URL for external requests
 * Throws error if URL is not in allowlist
 */
export function validateExternalUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: URL must be a non-empty string');
  }

  // Check protocol (only https allowed, except localhost)
  const parsedUrl = new URL(url);
  const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';

  if (parsedUrl.protocol !== 'https:' && !isLocalhost) {
    throw new Error('SSRF Protection: Only HTTPS URLs are allowed');
  }

  // Check allowlist
  if (!isAllowedDomain(url)) {
    throw new Error(`SSRF Protection: Domain not in allowlist - ${parsedUrl.hostname}`);
  }

  // Prevent IP addresses (force hostname)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname) && !isLocalhost) {
    throw new Error('SSRF Protection: IP addresses not allowed');
  }

  // Prevent localhost/private IPs in production
  if (process.env.NODE_ENV === 'production' && isLocalhost) {
    throw new Error('SSRF Protection: Localhost not allowed in production');
  }

  return url;
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitize user input for database queries
 * Prevents SQL injection and other injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)                           // Limit length
    .replace(/[\x00-\x1F\x7F]/g, '')              // Remove control characters
    .replace(/[<>]/g, '')                          // Remove HTML brackets
    .replace(/\\/g, '\\\\')                        // Escape backslashes
    .replace(/'/g, "''")                           // Escape single quotes
    .replace(/"/g, '""');                          // Escape double quotes
}

/**
 * Sanitize tracking number (alphanumeric only)
 */
export function sanitizeTrackingNumber(trackingNumber: string): string {
  if (typeof trackingNumber !== 'string') {
    return '';
  }

  return trackingNumber
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')  // Only alphanumeric
    .slice(0, 50);               // Max 50 chars
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize phone number (Turkish format)
 */
export function sanitizePhoneNumber(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  // Remove all non-numeric characters
  const numeric = phone.replace(/[^0-9]/g, '');

  // Turkish phone: 10 digits (5xxxxxxxxx) or 12 with country code (90 5xxxxxxxxx)
  if (numeric.length === 10 && numeric.startsWith('5')) {
    return `+90${numeric}`;
  }

  if (numeric.length === 12 && numeric.startsWith('905')) {
    return `+${numeric}`;
  }

  return null;
}

// ============================================================================
// KVKK/GDPR Data Redaction
// ============================================================================

/**
 * Redact sensitive data for logging
 * KVKK/GDPR compliant logging
 */
export function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'cvv',
    'ssn',
    'tcno', // Turkish ID number
    'email',
    'phone',
    'iban',
  ];

  const redacted = { ...data };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();

    // Check if key matches sensitive field
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      const value = redacted[key];

      if (typeof value === 'string' && value.length > 0) {
        // Show first 2 and last 2 characters
        if (value.length > 4) {
          redacted[key] = `${value.slice(0, 2)}***${value.slice(-2)}`;
        } else {
          redacted[key] = '***';
        }
      } else {
        redacted[key] = '***';
      }
    }

    // Recursively redact nested objects
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Redact Turkish ID number (TC Kimlik No)
 */
export function redactTCNo(tcno: string): string {
  if (typeof tcno !== 'string' || tcno.length !== 11) {
    return '***';
  }

  return `${tcno.slice(0, 2)}*******${tcno.slice(-2)}`;
}

/**
 * Redact credit card number
 */
export function redactCreditCard(cardNumber: string): string {
  if (typeof cardNumber !== 'string') {
    return '***';
  }

  const numeric = cardNumber.replace(/[^0-9]/g, '');

  if (numeric.length < 13) {
    return '***';
  }

  return `****-****-****-${numeric.slice(-4)}`;
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

/**
 * Generate rate limit key for user
 */
export function generateRateLimitKey(
  userId: string,
  action: string,
  windowMs: number = 60000
): string {
  const timestamp = Math.floor(Date.now() / windowMs);
  return `ratelimit:${userId}:${action}:${timestamp}`;
}

// ============================================================================
// CSRF Token Validation
// ============================================================================

/**
 * Validate CSRF token format
 */
export function isValidCsrfToken(token: string): boolean {
  if (typeof token !== 'string') {
    return false;
  }

  // CSRF tokens should be 32+ characters, alphanumeric + special chars
  const tokenRegex = /^[A-Za-z0-9\-_]{32,}$/;
  return tokenRegex.test(token);
}

// ============================================================================
// Export All
// ============================================================================

export const SecurityUtils = {
  escapeHtml,
  unescapeHtml,
  stripHtmlTags,
  isAllowedDomain,
  validateExternalUrl,
  sanitizeInput,
  sanitizeTrackingNumber,
  sanitizeEmail,
  sanitizePhoneNumber,
  redactSensitiveData,
  redactTCNo,
  redactCreditCard,
  generateRateLimitKey,
  isValidCsrfToken,
};

console.log('✅ Security utilities initialized (XSS + SSRF + KVKK protected)');
