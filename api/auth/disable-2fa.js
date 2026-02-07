/**
 * Disable 2FA (Two-Factor Authentication)
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Safely disable 2FA with password confirmation
 */

const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    // 🔒 SECURITY: Require password confirmation to disable 2FA
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    // 🔒 SECURITY: Extract user from JWT token
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);
    const authHeader = req.headers.authorization;

    let token = null;
    if (tokenMatch) {
      token = tokenMatch[1];
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const userId = decoded.id;

    // Get user with password hash
    const { getDatabase } = require('../../database/init-db');
const { handleCORS } = require('../../middleware/cors-handler');
    const db = getDatabase();
    let user;
    try {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } finally {
      db.close();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔒 SECURITY: Verify password before disabling 2FA
    const isValidPassword = await User.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Disable 2FA
    const db2 = getDatabase();
    try {
      db2.prepare(`
        UPDATE users
        SET twoFactorEnabled = 0,
            twoFactorSecret = NULL,
            twoFactorBackupCodes = NULL
        WHERE id = ?
      `).run(userId);
    } finally {
      db2.close();
    }

    // Log activity
    User.logActivity({
      userId,
      action: '2fa_disabled',
      description: '2FA disabled',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: '2FA has been disabled successfully'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
};
