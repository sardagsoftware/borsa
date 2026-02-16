/**
 * AILYDIAN Secure Share API - Retrieve Share
 * @route GET /api/s/:code
 * @version 1.0.0
 *
 * Features:
 * - WhatsApp-only access validation
 * - Decryption of messages
 * - Anti-indexing headers
 * - Expiration checks
 */

const crypto = require('crypto');
const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');

// Reference to shared storage from create.js
if (!globalThis.sharedMessages) {
  globalThis.sharedMessages = new Map();
}
const sharedMessages = globalThis.sharedMessages;

// Encryption key - must match create.js
const ENCRYPTION_KEY =
  process.env.SHARE_ENCRYPTION_KEY ||
  crypto.randomBytes(32).toString('hex').slice(0, 64);

// WhatsApp allowed referrers and user agents
const WHATSAPP_INDICATORS = [
  'whatsapp.com',
  'web.whatsapp.com',
  'wa.me',
  'api.whatsapp.com',
  'WhatsApp',
];

/**
 * Decrypt messages using AES-256-GCM
 */
function decryptMessages(encrypted) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const iv = Buffer.from(encrypted.iv, 'base64');
    const tag = Buffer.from(encrypted.tag, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[SHARE_DECRYPT_ERR]', error.message);
    return null;
  }
}

/**
 * Check if request is from WhatsApp
 */
function isWhatsAppRequest(req) {
  const referrer = req.headers.referer || req.headers.referrer || '';
  const userAgent = req.headers['user-agent'] || '';

  // Check referrer
  for (const indicator of WHATSAPP_INDICATORS) {
    if (referrer.toLowerCase().includes(indicator.toLowerCase())) {
      return true;
    }
  }

  // Check user agent for WhatsApp
  if (userAgent.includes('WhatsApp')) {
    return true;
  }

  // Check for WhatsApp in-app browser
  if (userAgent.includes('FBAN') || userAgent.includes('FBAV')) {
    // Facebook family apps, might be WhatsApp
    return true;
  }

  return false;
}

module.exports = async function handler(req, res) {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Anti-indexing headers - CRITICAL
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get code from URL - Vercel uses query for dynamic routes
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Paylaşım kodu gerekli.',
      });
    }

    // Get share data
    const share = sharedMessages.get(code);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Paylaşım bulunamadı veya süresi dolmuş.',
        expired: true,
      });
    }

    // Check expiration
    if (Date.now() > share.expiresAt) {
      sharedMessages.delete(code);
      return res.status(410).json({
        success: false,
        error: 'Paylaşım linkinin süresi dolmuş.',
        expired: true,
      });
    }

    // WhatsApp-only check
    if (share.whatsAppOnly) {
      const isWhatsApp = isWhatsAppRequest(req);

      if (!isWhatsApp) {
        console.log(
          `[SHARE_ACCESS_DENIED] Code: ${code}, Referrer: ${req.headers.referer || 'none'}, UA: ${req.headers['user-agent']?.slice(0, 50) || 'none'}`
        );

        return res.status(403).json({
          success: false,
          error: 'Bu link sadece WhatsApp üzerinden açılabilir.',
          whatsAppOnly: true,
          helpText: 'Linki WhatsApp sohbetinden tıklayarak açın.',
        });
      }
    }

    // Decrypt messages
    const messages = decryptMessages(share.encrypted);

    if (!messages) {
      return res.status(500).json({
        success: false,
        error: 'Mesajlar çözülemedi.',
      });
    }

    // Increment access count
    share.accessCount++;

    console.log(`[SHARE_ACCESS] Code: ${code}, Count: ${share.accessCount}`);

    return res.status(200).json({
      success: true,
      title: share.title,
      messages,
      createdAt: new Date(share.createdAt).toISOString(),
      expiresAt: new Date(share.expiresAt).toISOString(),
      accessCount: share.accessCount,
    });
  } catch (error) {
    console.error('[SHARE_RETRIEVE_ERR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Paylaşım alınamadı. Lütfen tekrar deneyin.',
    });
  }
};
