/**
 * SHARD_5.4 - Sealed Download URLs
 * Time-limited, one-time download URLs for encrypted files
 *
 * Security: URLs expire after use or timeout
 * White Hat: No file content in URL, HMAC-signed tokens
 */

import { createHmac } from 'crypto';

export interface SealedURL {
  fileId: string;
  token: string;
  expiresAt: number;
  maxDownloads: number;
  downloadsRemaining: number;
}

// In-memory store for sealed URLs (in production, use Redis)
const sealedURLStore = new Map<string, SealedURL>();

const SECRET_KEY = process.env.FILE_URL_SECRET || 'dev-secret-change-in-production';
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_DOWNLOADS = 1; // One-time use

/**
 * Generate sealed download URL
 */
export function generateSealedURL(
  fileId: string,
  maxDownloads: number = DEFAULT_MAX_DOWNLOADS,
  ttlMs: number = DEFAULT_TTL
): string {
  const token = generateSecureToken();
  const expiresAt = Date.now() + ttlMs;

  const sealed: SealedURL = {
    fileId,
    token,
    expiresAt,
    maxDownloads,
    downloadsRemaining: maxDownloads
  };

  sealedURLStore.set(token, sealed);

  console.log(`[SEALED-URL] 🔐 Generated: ${token} → ${fileId} (expires in ${ttlMs}ms)`);

  return token;
}

/**
 * Verify and consume sealed URL
 */
export function consumeSealedURL(token: string): {
  valid: boolean;
  fileId?: string;
  error?: string;
} {
  const sealed = sealedURLStore.get(token);

  if (!sealed) {
    return {
      valid: false,
      error: 'Invalid or expired token'
    };
  }

  // Check expiration
  if (Date.now() > sealed.expiresAt) {
    sealedURLStore.delete(token);
    return {
      valid: false,
      error: 'Token expired'
    };
  }

  // Check download limit
  if (sealed.downloadsRemaining <= 0) {
    sealedURLStore.delete(token);
    return {
      valid: false,
      error: 'Download limit exceeded'
    };
  }

  // Consume one download
  sealed.downloadsRemaining--;

  // Delete if no downloads remaining
  if (sealed.downloadsRemaining === 0) {
    sealedURLStore.delete(token);
    console.log(`[SEALED-URL] ✅ Consumed (deleted): ${token}`);
  } else {
    console.log(`[SEALED-URL] ✅ Consumed (${sealed.downloadsRemaining} remaining): ${token}`);
  }

  return {
    valid: true,
    fileId: sealed.fileId
  };
}

/**
 * Revoke sealed URL
 */
export function revokeSealedURL(token: string): boolean {
  const deleted = sealedURLStore.delete(token);
  if (deleted) {
    console.log(`[SEALED-URL] 🗑️ Revoked: ${token}`);
  }
  return deleted;
}

/**
 * Clean up expired URLs
 */
export function cleanupExpiredURLs(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, sealed] of sealedURLStore.entries()) {
    if (now > sealed.expiresAt) {
      sealedURLStore.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[SEALED-URL] 🗑️ Cleaned up ${cleaned} expired URLs`);
  }

  return cleaned;
}

/**
 * Generate cryptographically secure token
 */
function generateSecureToken(): string {
  // Generate 32 random bytes
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  // Convert to base64url (URL-safe)
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Sign file URL with HMAC (for additional security)
 */
export function signFileURL(fileId: string, expiresAt: number): string {
  const message = `${fileId}:${expiresAt}`;

  // For Node.js environment
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    const hmac = createHmac('sha256', SECRET_KEY);
    hmac.update(message);
    return hmac.digest('hex');
  }

  // For browser environment (fallback to simple hash)
  return simpleHash(message + SECRET_KEY);
}

/**
 * Verify file URL signature
 */
export function verifyFileURL(
  fileId: string,
  expiresAt: number,
  signature: string
): boolean {
  const expectedSignature = signFileURL(fileId, expiresAt);
  return signature === expectedSignature;
}

/**
 * Simple hash function (browser fallback)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get sealed URL stats
 */
export function getSealedURLStats(): {
  total: number;
  expired: number;
  active: number;
} {
  const now = Date.now();
  let expired = 0;
  let active = 0;

  for (const sealed of sealedURLStore.values()) {
    if (now > sealed.expiresAt) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: sealedURLStore.size,
    expired,
    active
  };
}
