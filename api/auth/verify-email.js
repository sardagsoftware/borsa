/**
 * Verify Email
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Complete email verification
 */

const User = require('../../backend/models/User');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  try {
    const { token } = req.method === 'POST' ? req.body : req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find verification token
    const { getDatabase } = require('../../database/init-db');
const { handleCORS } = require('../../middleware/cors-handler');
    const db = getDatabase();

    let verification;
    let user;

    try {
      verification = db.prepare(`
        SELECT * FROM email_verification
        WHERE token = ? AND used = 0 AND expiresAt > datetime('now')
      `).get(token);

      if (!verification) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Mark token as used
      db.prepare('UPDATE email_verification SET used = 1 WHERE id = ?').run(verification.id);

      // Update user email verified status
      db.prepare('UPDATE users SET emailVerified = 1 WHERE id = ?').run(verification.userId);

      // Get updated user
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(verification.userId);
    } finally {
      db.close();
    }

    // Log activity
    User.logActivity({
      userId: verification.userId,
      action: 'email_verified',
      description: 'Email address verified successfully',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    console.log(`✅ Email verified for user ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: user.email,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
};
