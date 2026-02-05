/**
 * Chat Auth Login API
 * POST /api/chat-auth/login
 */

const { chatUsers, chatSessions, chatSettings } = require('./_lib/db');
const { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } = require('./_lib/jwt');
const { setAuthCookies } = require('./_lib/cookies');
const { verifyPassword, validateEmail, checkRateLimit } = require('./_lib/password');

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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-posta ve şifre gerekli'
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

    // Rate limiting by IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     'unknown';

    const rateLimit = checkRateLimit(`login:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: `Çok fazla deneme. ${rateLimit.resetIn} saniye sonra tekrar deneyin.`
      });
    }

    // Find user by email
    const user = await chatUsers.findByEmail(emailValidation.email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'E-posta veya şifre hatalı'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'E-posta veya şifre hatalı'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = getRefreshTokenExpiry();

    // Store session
    const userAgent = req.headers['user-agent'] || 'unknown';
    await chatSessions.create(user.id, refreshToken, expiresAt.toISOString(), clientIP, userAgent);

    // Update last login
    await chatUsers.updateLastLogin(user.id);

    // Ensure user has settings
    await chatSettings.create(user.id);

    // Set httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return user data (no tokens in body - they're in cookies)
    return res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('[CHAT_AUTH_LOGIN_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Giriş işlemi başarısız. Lütfen tekrar deneyin.'
    });
  }
};
