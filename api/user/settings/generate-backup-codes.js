/**
 * Generate Backup Codes for 2FA
 * Allows users to regenerate backup codes
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../../../database/init-db');
const { handleCORS } = require('../../../middleware/cors-handler');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const db = getDatabase();

  try {
    // 🔒 SECURITY: Get user from auth token
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not set');
      return res.status(500).json({ success: false, message: 'Sunucu yapılandırma hatası' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get password from request body
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to generate backup codes'
      });
    }

    // Get user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔒 SECURITY: Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
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
        message: '2FA must be enabled to generate backup codes'
      });
    }

    // Generate 10 backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Log activity
    User.logActivity({
      userId,
      action: 'backup_codes_generated',
      description: 'New backup codes generated'
    });

    return res.status(200).json({
      success: true,
      message: 'Backup codes generated successfully',
      data: {
        backupCodes,
        warning: 'Save these codes in a safe place. They can only be used once.'
      }
    });

  } catch (error) {
    console.error('Generate backup codes error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate backup codes'
    });
  } finally {
    db.close();
  }
};
