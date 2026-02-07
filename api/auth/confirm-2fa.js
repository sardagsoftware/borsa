/**
 * Confirm 2FA Setup
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Verify and activate 2FA
 */

const User = require('../../backend/models/User');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '6-digit code is required'
      });
    }

    // 🔒 SECURITY: Validate code format
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Code must be 6 digits'
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

    // Get user with full data (including twoFactorSecret)
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

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA setup not initiated. Please enable 2FA first.'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 60 second window
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid code. Please try again.'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric backup codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
    }

    // Enable 2FA and save backup codes
    const db2 = getDatabase();
    try {
      db2.prepare(`
        UPDATE users
        SET twoFactorEnabled = 1,
            twoFactorBackupCodes = ?
        WHERE id = ?
      `).run(JSON.stringify(backupCodes), userId);
    } finally {
      db2.close();
    }

    // Log activity
    User.logActivity({
      userId,
      action: '2fa_enabled',
      description: '2FA successfully enabled',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: '2FA enabled successfully!',
      data: {
        backupCodes: backupCodes,
        warning: 'Save these backup codes in a secure place. Each can only be used once.'
      }
    });

  } catch (error) {
    console.error('Confirm 2FA error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to confirm 2FA'
    });
  }
};
