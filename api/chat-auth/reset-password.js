/**
 * Chat Auth Reset Password API
 * POST /api/chat-auth/reset-password
 * Reset password using reset token
 */

const { chatUsers, passwordResets, chatSessions } = require('./_lib/db');
const { hashPassword, validatePasswordStrength, checkRateLimit } = require('./_lib/password');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
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
    const { token, password } = req.body;

    // Validate inputs
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token ve yeni şifre gerekli'
      });
    }

    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown';

    const rateLimit = checkRateLimit(`reset:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Çok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`
      });
    }

    // Find reset token
    const resetRecord = await passwordResets.findByToken(token);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş bağlantı'
      });
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      await passwordResets.markUsed(token);
      return res.status(400).json({
        success: false,
        error: 'Şifre sıfırlama bağlantısının süresi dolmuş'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.errors[0],
        errors: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user's password
    await chatUsers.updatePassword(resetRecord.user_id, passwordHash);

    // Mark reset token as used
    await passwordResets.markUsed(token);

    // Invalidate all existing sessions for security
    await chatSessions.invalidateAllForUser(resetRecord.user_id);

    console.log('[CHAT_AUTH_RESET_PASSWORD] Password reset successful for user:', resetRecord.user_id);

    return res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.'
    });

  } catch (error) {
    console.error('[CHAT_AUTH_RESET_PASSWORD_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama başarısız. Lütfen tekrar deneyin.'
    });
  }
};
