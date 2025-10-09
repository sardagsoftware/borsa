/**
 * Password reset request endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Rate limiting to prevent abuse + Email enumeration protection
 */

const User = require('../../backend/models/User');
const crypto = require('crypto');
const { passwordResetRateLimit } = require('../../middleware/security-rate-limiters');

module.exports = async (req, res) => {
  // 🔒 BEYAZ ŞAPKALI: Apply password reset rate limiting FIRST
  await new Promise((resolve, reject) => {
    passwordResetRateLimit(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {
    return; // Rate limit response already sent
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      // 🔒 SECURITY: Always return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link has been sent'
      });
    }

    // 🔒 SECURITY: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      // 🔒 SECURITY: Still return success
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link has been sent'
      });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());

    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save token to user (implement this in User model)
      await User.setPasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // TODO: Send email with reset link
      // const resetLink = `${req.headers.origin}/reset-password.html?token=${resetToken}`;
      // await sendEmail(user.email, 'Password Reset', resetLink);

      console.log(`Password reset requested for ${user.email}`);
    }

    // 🔒 SECURITY: Always return the same response
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    // 🔒 SECURITY: Still return success
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been sent'
    });
  }
};
