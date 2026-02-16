/**
 * Chat Auth Logout All API
 * POST /api/chat-auth/logout-all - Invalidate all sessions for user
 */

const { chatSessions } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { clearAuthCookies, parseCookies } = require('./_lib/cookies');
const { getCorsOrigin } = require('../_middleware/cors');

const { applySanitization } = require('../_middleware/sanitize');
module.exports = async function handler(req, res) {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Bu istek yöntemi desteklenmiyor' });
  }

  try {
    // Parse cookies
    req.cookies = parseCookies(req);

    // Extract and verify token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Giriş yapmanız gerekli',
      });
    }

    const authResult = verifyAccessToken(token);

    if (!authResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'Oturum süresi dolmuş',
      });
    }

    const userId = authResult.payload.userId;

    // Invalidate all sessions for this user
    await chatSessions.invalidateAllForUser(userId);

    // Clear current cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Tüm oturumlar kapatıldı',
    });
  } catch (error) {
    console.error('[CHAT_AUTH_LOGOUT_ALL_ERROR]', error.message);

    // Still clear cookies even if there's an error
    clearAuthCookies(res);

    return res.status(500).json({
      success: false,
      error: 'Oturumlar kapatılırken hata oluştu',
    });
  }
};
