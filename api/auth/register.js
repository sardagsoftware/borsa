/**
 * User registration endpoint
 * Vercel Serverless Function
 *
 * @version 2.0.0 - Added reCAPTCHA v3 protection
 */

const User = require('../../backend/models/User');
const { handleCORS } = require('../../middleware/cors-handler');
const { requireRecaptcha } = require('../_lib/recaptcha-verify');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    // 🔒 SECURITY: Verify reCAPTCHA token
    const recaptchaResult = await requireRecaptcha(req);
    if (!recaptchaResult.success) {
      return res.status(400).json({
        success: false,
        message: recaptchaResult.error || 'reCAPTCHA verification failed',
        code: recaptchaResult.code || 'RECAPTCHA_ERROR',
      });
    }

    // 🔒 SECURITY: Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required',
      });
    }

    // 🔒 SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // 🔒 SECURITY: Beyaz Şapkalı Password Validation
    const passwordValidation = User.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed',
        errors: passwordValidation.errors,
      });
    }

    // 🔒 SECURITY: Name validation
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters',
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email.toLowerCase().trim());
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user
    const user = await User.createUser({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
    });

    // 🔒 SECURITY: Don't auto-login, require email verification
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Kayit islemi basarisiz. Lutfen tekrar deneyin.',
    });
  }
};
