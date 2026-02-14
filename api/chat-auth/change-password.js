/**
 * Chat Auth Change Password API
 * POST /api/chat-auth/change-password
 * Change password for authenticated user
 */

const { chatUsers } = require('./_lib/db');
const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { getCorsOrigin } = require('../_middleware/cors');
const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  checkRateLimit,
} = require('./_lib/password');
const { parseBody } = require('./_lib/body-parser');

module.exports = async function handler(req, res) {
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

    // Verify authentication
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

    const body = parseBody(req);
    const { currentPassword, newPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve yeni şifre gerekli',
      });
    }

    // Rate limiting
    const clientIP =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    const rateLimit = checkRateLimit(`change:${authResult.payload.userId}:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Çok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`,
      });
    }

    // Get user from database
    const user = await chatUsers.findById(authResult.payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mevcut şifre yanlış',
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Yeni şifre mevcut şifreden farklı olmalı',
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors[0],
        errors: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await chatUsers.updatePassword(user.id, newPasswordHash);

    // Optionally: Invalidate other sessions (keep current one)
    // chatSessions.invalidateAllForUser(user.id);

    console.log('[CHAT_AUTH_CHANGE_PASSWORD] Password changed for user:', user.email);

    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi',
    });
  } catch (error) {
    console.error('[CHAT_AUTH_CHANGE_PASSWORD_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Şifre değiştirme başarısız. Lütfen tekrar deneyin.',
    });
  }
};
