/**
 * Chat Auth Logout API
 * POST /api/chat-auth/logout
 */

const { chatSessions } = require('./_lib/db');
const { extractRefreshToken } = require('./_lib/jwt');
const { clearAuthCookies, parseCookies } = require('./_lib/cookies');
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
    // Parse cookies
    req.cookies = parseCookies(req);

    // Get refresh token
    const refreshToken = extractRefreshToken(req);

    // Invalidate session if token exists
    if (refreshToken) {
      await chatSessions.invalidate(refreshToken);
    }

    // Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Çıkış yapıldı',
    });
  } catch (error) {
    console.error('[CHAT_AUTH_LOGOUT_ERROR]', error.message);

    // Still clear cookies even if there's an error
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Çıkış yapıldı',
    });
  }
};
