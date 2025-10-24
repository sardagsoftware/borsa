/**
 * Security Utilities
 * Enterprise-grade security features
 */

import crypto from 'crypto';

// ============================================================
// 1. CSRF Protection
// ============================================================

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

// ============================================================
// 2. Rate Limiting (Memory-based)
// ============================================================

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore[identifier];

  if (!record || now > record.resetTime) {
    rateLimitStore[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 300000);

// ============================================================
// 3. Input Sanitization
// ============================================================

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove HTML/script chars
    .substring(0, 1000); // Max length
}

export function sanitizeSymbol(symbol: string): string {
  if (typeof symbol !== 'string') return 'BTCUSDT';

  const cleaned = symbol
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only alphanumeric
    .substring(0, 20);

  return cleaned || 'BTCUSDT';
}

export function sanitizeNumber(
  value: any,
  min?: number,
  max?: number,
  defaultValue: number = 0
): number {
  const num = parseFloat(value);

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;

  return num;
}

// ============================================================
// 4. Data Encryption (AES-256)
// ============================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

function getKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'default-secret-change-this-in-production';
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
}

export function encrypt(text: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted,
    ].join(':');
  } catch (error) {
    console.error('[Encryption] Error:', error);
    throw new Error('Encryption failed');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) throw new Error('Invalid format');

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    const key = getKey(salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Decryption] Error:', error);
    throw new Error('Decryption failed');
  }
}

// ============================================================
// 5. Password Hashing (bcrypt-compatible)
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':');
    const hashVerify = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');

    return hash === hashVerify;
  } catch (error) {
    return false;
  }
}

// ============================================================
// 6. Token Generation
// ============================================================

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateAPIKey(): string {
  return `sk-${crypto.randomBytes(32).toString('base64url')}`;
}

// ============================================================
// 7. IP Address Extraction
// ============================================================

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const cloudflare = req.headers.get('cf-connecting-ip');

  if (cloudflare) return cloudflare;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (real) return real;

  return 'unknown';
}

// ============================================================
// 8. Security Headers
// ============================================================

export function getSecurityHeaders(): HeadersInit {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: https://fapi.binance.com https://fstream.binance.com",
      "frame-ancestors 'none'",
    ].join('; '),

    // HSTS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // XSS Protection
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',

    // Referrer
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

// ============================================================
// 9. Request Validation
// ============================================================

export function validateRequest(req: Request): {
  valid: boolean;
  error?: string;
} {
  // Method whitelist
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!allowedMethods.includes(req.method)) {
    return { valid: false, error: 'Method not allowed' };
  }

  // Content-Type validation for POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { valid: false, error: 'Invalid content-type' };
    }
  }

  return { valid: true };
}

// ============================================================
// 10. SQL Injection Prevention
// ============================================================

export function escapeSQL(value: string): string {
  if (typeof value !== 'string') return '';

  return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
    switch (char) {
      case '\0': return '\\0';
      case '\x08': return '\\b';
      case '\x09': return '\\t';
      case '\x1a': return '\\z';
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '"':
      case "'":
      case '\\':
      case '%':
        return '\\' + char;
      default:
        return char;
    }
  });
}

// ============================================================
// Export All
// ============================================================

export const Security = {
  // CSRF
  generateCSRFToken,
  validateCSRFToken,

  // Rate Limiting
  checkRateLimit,

  // Sanitization
  sanitizeString,
  sanitizeSymbol,
  sanitizeNumber,

  // Encryption
  encrypt,
  decrypt,

  // Password
  hashPassword,
  verifyPassword,

  // Tokens
  generateSecureToken,
  generateAPIKey,

  // Request
  getClientIP,
  getSecurityHeaders,
  validateRequest,

  // SQL
  escapeSQL,
};

export default Security;
