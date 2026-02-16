/**
 * Chat Auth Account API
 * DELETE /api/chat-auth/account - Delete user account
 */

const { chatUsers, chatSessions, chatSettings, chatConversations } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { clearAuthCookies, parseCookies } = require('./_lib/cookies');
const { getCorsOrigin } = require('../_middleware/cors');

const { applySanitization } = require('../_middleware/sanitize');
module.exports = async function handler(req, res) {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    // Verify user exists before proceeding
    const user = await chatUsers.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    // 1. Invalidate all sessions
    await chatSessions.invalidateAllForUser(userId);

    // 2. Delete all conversations and their messages
    await chatConversations.deleteAllForUser(userId);

    // 3. Delete user settings
    await chatSettings.delete(userId);

    // 4. Mark user as deleted (soft delete)
    await chatUsers.deactivate(userId);

    // 5. Clear cookies
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Hesabınız başarıyla silindi',
    });
  } catch (error) {
    console.error('[CHAT_AUTH_ACCOUNT_DELETE_ERROR]', error.message);

    // Clear cookies even on error
    clearAuthCookies(res);

    return res.status(500).json({
      success: false,
      error: 'Hesap silinirken bir hata oluştu',
    });
  }
};
