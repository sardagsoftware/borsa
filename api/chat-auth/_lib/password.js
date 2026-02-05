/**
 * Chat Auth Password Utilities
 * Secure password hashing and validation
 */

const bcrypt = require('bcrypt');

// bcrypt salt rounds (12 is recommended for production)
const SALT_ROUNDS = 12;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Hash a password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Returns { valid: boolean, errors: string[], strength: 'weak'|'medium'|'strong' }
 */
function validatePasswordStrength(password) {
  const errors = [];
  let score = 0;

  // Length check
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı`);
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  if (password && password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir`);
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermeli');
  } else {
    score += 1;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermeli');
  } else {
    score += 1;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('En az bir rakam içermeli');
  } else {
    score += 1;
  }

  // Special character check (optional but adds to score)
  if (/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password)) {
    score += 2;
  }

  // Determine strength
  let strength = 'weak';
  if (score >= 6) {
    strength = 'strong';
  } else if (score >= 4) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'E-posta adresi gerekli' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Geçersiz e-posta formatı' };
  }

  // Length check
  if (trimmed.length > 255) {
    return { valid: false, error: 'E-posta adresi çok uzun' };
  }

  return { valid: true, email: trimmed };
}

/**
 * Validate display name
 */
function validateDisplayName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Ad soyad gerekli' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Ad soyad en az 2 karakter olmalı' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Ad soyad en fazla 100 karakter olabilir' };
  }

  // Check for invalid characters (only allow letters, spaces, and common name characters)
  if (!/^[\p{L}\s\-'.]+$/u.test(trimmed)) {
    return { valid: false, error: 'Ad soyad geçersiz karakterler içeriyor' };
  }

  return { valid: true, displayName: trimmed };
}

/**
 * Generate a secure random token
 */
function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { timestamp: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((record.timestamp + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, resetIn };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.timestamp > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  validateEmail,
  validateDisplayName,
  generateSecureToken,
  checkRateLimit,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH
};
