/**
 * Send Verification Email
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Email verification + Rate limiting
 */

const { sendVerificationEmail, generateVerificationToken } = require('../../lib/email-service');
const User = require('../../backend/models/User');
const { emailSendRateLimit } = require('../../middleware/security-rate-limiters');
const { getDatabase } = require('../../database/init-db');
const { handleCORS } = require('../../middleware/cors-handler');
const { applySanitization } = require('../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  // 🔒 BEYAZ ŞAPKALI: Apply email rate limiting
  await new Promise((resolve, reject) => {
    emailSendRateLimit(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {
    return; // Rate limit response already sent
  });

  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findByEmail(email.toLowerCase().trim());

    if (!user) {
      // 🔒 SECURITY: Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If this email is registered, a verification email has been sent'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Save token to database
    const db = getDatabase();
    try {
      // Delete old verification tokens
      db.prepare('DELETE FROM email_verification WHERE userId = ? AND used = 0').run(user.id);

      // Create new token
      db.prepare(`
        INSERT INTO email_verification (userId, token, expiresAt)
        VALUES (?, ?, ?)
      `).run(user.id, token, expiresAt.toISOString());
    } finally {
      db.close();
    }

    // Send verification email
    await sendVerificationEmail(user, token);

    // Log activity
    User.logActivity({
      userId: user.id,
      action: 'verification_email_sent',
      description: 'Email verification sent',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Send verification email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
};
