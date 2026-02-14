/**
 * Chat Auth Forgot Password API
 * POST /api/chat-auth/forgot-password
 * Request password reset link with secure email delivery
 */

const { chatUsers, passwordResets } = require('./_lib/db');
const { validateEmail, generateSecureToken, checkRateLimit } = require('./_lib/password');
const { parseBody } = require('./_lib/body-parser');
const { sendPasswordResetEmail } = require('../../lib/email-service');
const { getCorsOrigin } = require('../_middleware/cors');

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
    return res.status(405).json({ success: false, error: 'Bu istek yöntemi desteklenmiyor' });
  }

  try {
    const body = parseBody(req);
    const { email } = body;

    // Validate email is present
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-posta adresi gerekli',
      });
    }

    // Rate limiting by IP
    const clientIP =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    const rateLimit = checkRateLimit(`forgot:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Çok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`,
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

    // Find user - but don't reveal if user exists
    const user = await chatUsers.findByEmail(emailValidation.email);

    // Always return success (security - don't reveal if email exists)
    // But only create reset token if user exists
    if (user) {
      // Invalidate any existing reset tokens for this user
      await passwordResets.invalidateForUser(user.id);

      // Generate reset token
      const resetToken = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await passwordResets.create(user.id, resetToken, expiresAt.toISOString());

      // Send password reset email
      try {
        await sendPasswordResetEmail({ email: user.email, name: user.display_name }, resetToken);
        console.log('[CHAT_AUTH_FORGOT_PASSWORD] Reset email sent to:', emailValidation.email);
      } catch (emailError) {
        // Log error but don't fail the request (security)
        console.error('[CHAT_AUTH_FORGOT_PASSWORD] Email send error:', emailError.message);
        // Continue - we don't want to reveal if email was sent or not
      }
    }

    // Always return same response for security
    return res.status(200).json({
      success: true,
      message: 'Eğer bu e-posta ile bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.',
    });
  } catch (error) {
    console.error('[CHAT_AUTH_FORGOT_PASSWORD_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
};
