/**
 * Chat Auth Check Email API
 * POST /api/chat-auth/check-email
 */

const { chatUsers } = require('./_lib/db');
const { validateEmail, checkRateLimit } = require('./_lib/password');
const { parseBody } = require('./_lib/body-parser');
const { getCorsOrigin } = require('../_middleware/cors');

const { applySanitization } = require('../_middleware/sanitize');
module.exports = async function handler(req, res) {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Bu istek yöntemi desteklenmiyor' });
  }

  try {
    const body = parseBody(req);
    const { email } = body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-posta adresi gerekli',
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        error: emailValidation.error,
      });
    }

    // Rate limiting by IP
    const clientIP =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    const rateLimit = checkRateLimit(`check-email:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Cok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`,
      });
    }

    // Check if user exists
    const user = await chatUsers.findByEmail(emailValidation.email);

    return res.status(200).json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('[CHAT_AUTH_CHECK_EMAIL_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'E-posta kontrol islemi basarisiz. Lutfen tekrar deneyin.',
    });
  }
};
