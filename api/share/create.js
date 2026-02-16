/**
 * AILYDIAN Secure Share API - Create Encrypted Share
 * @route POST /api/share/create
 * @version 1.0.0
 *
 * Features:
 * - AES-256-GCM encryption for messages
 * - Short 6-character URL codes
 * - WhatsApp-only access restriction
 * - 24-hour default expiration
 * - Anti-indexing headers
 */

const crypto = require('crypto');
const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');

// In-memory storage (in production, use Redis/PostgreSQL)
// This is shared across requests via globalThis scope
if (!globalThis.sharedMessages) {
  globalThis.sharedMessages = new Map();
}
const sharedMessages = globalThis.sharedMessages;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // Max shares per minute per IP

// Encryption key - should be set in environment variables
const ENCRYPTION_KEY =
  process.env.SHARE_ENCRYPTION_KEY ||
  crypto.randomBytes(32).toString('hex').slice(0, 64);

/**
 * Generate a short, URL-safe share code (6 characters)
 */
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Encrypt messages using AES-256-GCM
 */
function encryptMessages(messages) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(JSON.stringify(messages), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  return {
    data: encrypted,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

/**
 * Parse expiration time string to milliseconds
 */
function parseExpiration(expiresIn) {
  const match = expiresIn.match(/^(\d+)(h|d|m)?$/i);
  if (!match) return 24 * 60 * 60 * 1000; // Default 24h

  const value = parseInt(match[1]);
  const unit = (match[2] || 'h').toLowerCase();

  switch (unit) {
    case 'm':
      return value * 60 * 1000; // minutes
    case 'h':
      return value * 60 * 60 * 1000; // hours
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Get client IP from request
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    '127.0.0.1'
  );
}

/**
 * Cleanup expired shares
 */
function cleanupExpiredShares() {
  const now = Date.now();
  for (const [code, data] of sharedMessages.entries()) {
    if (data.expiresAt < now) {
      sharedMessages.delete(code);
      console.log(`[SHARE_CLEANUP] Expired: ${code}`);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredShares, 5 * 60 * 1000);

module.exports = async function handler(req, res) {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Anti-indexing headers
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'private, no-cache, no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Çok fazla istek. Lütfen bir dakika bekleyin.',
      });
    }

    const { messages, expiresIn = '24h', whatsAppOnly = true, title } = req.body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Mesaj dizisi gerekli.',
      });
    }

    // Limit message count and size
    if (messages.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maksimum 100 mesaj paylaşılabilir.',
      });
    }

    // Generate unique short code
    let code;
    let attempts = 0;
    do {
      code = generateShortCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({
          success: false,
          error: 'Paylaşım kodu oluşturulamadı. Lütfen tekrar deneyin.',
        });
      }
    } while (sharedMessages.has(code));

    // Encrypt messages
    const encrypted = encryptMessages(messages);

    // Calculate expiration
    const expiresAt = Date.now() + parseExpiration(expiresIn);

    // Store share data
    sharedMessages.set(code, {
      encrypted,
      expiresAt,
      whatsAppOnly,
      title: title || 'LyDian AI Sohbeti',
      createdAt: Date.now(),
      accessCount: 0,
      creatorIP: clientIP,
    });

    console.log(`[SHARE_CREATE] Code: ${code}, WhatsAppOnly: ${whatsAppOnly}`);

    // Generate share URL
    const baseUrl = process.env.BASE_URL || 'https://www.ailydian.com';
    const shareUrl = `${baseUrl}/s/${code}`;

    return res.status(200).json({
      success: true,
      code,
      shareUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      whatsAppOnly,
    });
  } catch (error) {
    console.error('[SHARE_CREATE_ERR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Paylaşım oluşturulamadı. Lütfen tekrar deneyin.',
    });
  }
};
