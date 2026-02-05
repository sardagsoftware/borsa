/**
 * Chat Auth Register API
 * POST /api/chat-auth/register
 */

const { chatUsers, chatSettings } = require('./_lib/db');
const {
  hashPassword,
  validatePasswordStrength,
  validateEmail,
  validateDisplayName,
  checkRateLimit
} = require('./_lib/password');

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
    const { email, password, displayName } = req.body;

    // Validate all inputs are present
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar gerekli'
      });
    }

    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown';

    const rateLimit = checkRateLimit(`register:${clientIP}`);
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

    // Validate display name
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        error: nameValidation.error
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

    // Check if email already exists
    const existingUser = await chatUsers.findByEmail(emailValidation.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Bu e-posta adresi zaten kayıtlı'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = await chatUsers.create(
      emailValidation.email,
      passwordHash,
      nameValidation.displayName
    );

    // Create default settings
    await chatSettings.create(userId);

    console.log('[CHAT_AUTH_REGISTER]', `New user registered: ${emailValidation.email}`);

    return res.status(201).json({
      success: true,
      message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.',
      userId
    });

  } catch (error) {
    console.error('[CHAT_AUTH_REGISTER_ERROR]', error.message);

    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'Bu e-posta adresi zaten kayıtlı'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.'
    });
  }
};
