/**
 * Chat Auth Me API
 * GET /api/chat-auth/me
 * Returns current authenticated user info
 */

const { chatUsers, chatSettings } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { getCorsOrigin } = require('../_middleware/cors');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse cookies
    req.cookies = parseCookies(req);

    // Extract and verify token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Oturum bulunamadı',
        authenticated: false
      });
    }

    const result = verifyAccessToken(token);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: 'Oturum süresi dolmuş',
        authenticated: false,
        expired: result.error === 'jwt expired'
      });
    }

    // Get fresh user data from database
    const user = await chatUsers.findById(result.payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        authenticated: false
      });
    }

    // Get user settings
    const settings = await chatSettings.get(user.id);

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        authProvider: user.auth_provider || 'email',
        googleLinked: user.google_linked === 'true' || user.auth_provider === 'google',
        twoFactorEnabled: user.two_factor_enabled === 'true',
        createdAt: user.created_at
      },
      settings: settings ? {
        theme: settings.theme,
        language: settings.language,
        preferredModel: settings.preferred_model,
        autoSave: settings.auto_save
      } : null
    });

  } catch (error) {
    console.error('[CHAT_AUTH_ME_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgisi alınamadı',
      authenticated: false
    });
  }
};
