/**
 * Chat Auth Refresh API
 * POST /api/chat-auth/refresh
 * Refresh access token using refresh token
 */

const { chatUsers, chatSessions } = require('./_lib/db');
const { getCorsOrigin } = require('../_middleware/cors');
const {
  generateAccessToken,
  extractRefreshToken,
  verifyRefreshToken
} = require('./_lib/jwt');
const { updateAccessCookie, parseCookies } = require('./_lib/cookies');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse cookies
    req.cookies = parseCookies(req);

    // Get refresh token
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token bulunamadı'
      });
    }

    // Verify refresh token
    const result = verifyRefreshToken(refreshToken);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş refresh token'
      });
    }

    // Check if session exists and is valid
    const session = await chatSessions.findByToken(refreshToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Oturum geçersiz'
      });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await chatSessions.invalidate(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'Oturum süresi dolmuş'
      });
    }

    // Get user
    const user = await chatUsers.findById(result.payload.userId);

    if (!user) {
      await chatSessions.invalidate(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    // Update cookie
    updateAccessCookie(res, accessToken);

    return res.status(200).json({
      success: true,
      message: 'Token yenilendi',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('[CHAT_AUTH_REFRESH_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Token yenileme başarısız'
    });
  }
};
