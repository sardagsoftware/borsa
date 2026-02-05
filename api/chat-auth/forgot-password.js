/**
 * Chat Auth Forgot Password API
 * POST /api/chat-auth/forgot-password
 * Request password reset link
 */

const { chatUsers, passwordResets } = require('./_lib/db');
const { validateEmail, generateSecureToken, checkRateLimit } = require('./_lib/password');
const { parseBody } = require('./_lib/body-parser');

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
    const body = parseBody(req);
    const { email } = body;

    // Validate email is present
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'E-posta adresi gerekli'
      });
    }

    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown';

    const rateLimit = checkRateLimit(`forgot:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Çok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        error: emailValidation.error
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

      // In production, you would send an email here
      // For now, log it (in development only)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[CHAT_AUTH_FORGOT_PASSWORD] Reset token for', emailValidation.email, ':', resetToken);
        console.log('[CHAT_AUTH_FORGOT_PASSWORD] Reset URL: /chat?reset=' + resetToken);
      }

      // TODO: Send email with reset link
      // sendPasswordResetEmail(user.email, resetToken);
    }

    // Always return same response for security
    return res.status(200).json({
      success: true,
      message: 'Eğer bu e-posta ile bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.'
    });

  } catch (error) {
    console.error('[CHAT_AUTH_FORGOT_PASSWORD_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız. Lütfen tekrar deneyin.'
    });
  }
};
