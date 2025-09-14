import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-here';

/**
 * Encrypt sensitive data like API keys
 */
export function encrypt(text: string): string {
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data like API keys
 */
export function decrypt(encryptedText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Generate API key name suggestions
 */
export function generateKeyName(exchange: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${exchange}-${timestamp}`;
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string, exchange: string): boolean {
  switch (exchange.toUpperCase()) {
    case 'BINANCE':
      return /^[A-Za-z0-9]{64}$/.test(key);
    case 'BYBIT':
      return /^[A-Za-z0-9-]{36}$/.test(key);
    case 'OKX':
      return /^[a-f0-9-]{36}$/.test(key);
    default:
      return key.length > 10; // Basic validation
  }
}

/**
 * Validate secret key format
 */
export function validateSecretKey(secret: string, exchange: string): boolean {
  switch (exchange.toUpperCase()) {
    case 'BINANCE':
      return /^[A-Za-z0-9]{64}$/.test(secret);
    case 'BYBIT':
      return /^[A-Za-z0-9]{20}$/.test(secret);
    case 'OKX':
      return /^[A-Fa-f0-9-]{36}$/.test(secret);
    default:
      return secret.length > 10; // Basic validation
  }
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  LOGIN_ATTEMPTS_PER_HOUR: 5,
  PASSWORD_RESET_PER_DAY: 3,
  API_KEY_CREATION_PER_DAY: 10,
};

/**
 * Security validation rules
 */
export const SECURITY_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  SESSION_TIMEOUT_HOURS: 24,
  API_KEY_ROTATION_DAYS: 90,
};

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < SECURITY_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_RULES.PASSWORD_MIN_LENGTH} characters long`);
  } else {
    score += 1;
  }

  if (SECURITY_RULES.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (SECURITY_RULES.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (SECURITY_RULES.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (SECURITY_RULES.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.floor((score / 5) * 100),
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Check if IP is in allowed range (for additional security)
 */
export function isAllowedIP(ip: string, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) return true;
  return allowedIPs.includes(ip);
}
