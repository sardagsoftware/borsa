/**
 * Confirm and Activate Two-Factor Authentication
 * Verifies the code from authenticator app
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { handleCORS } = require('../../../middleware/cors-handler');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 🔒 SECURITY: Get user from auth token
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const userId = decoded.id;

    // Get verification code from request
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }

    // 🔒 SECURITY: Validate code format
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code format. Must be 6 digits.'
      });
    }

    // Verify and activate 2FA
    const result = User.confirmTwoFactor(userId, code);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }

    // Log activity
    User.logActivity({
      userId,
      action: '2fa_enabled',
      description: '2FA successfully enabled'
    });

    return res.status(200).json({
      success: true,
      message: '2FA has been successfully enabled',
      data: {
        backupCodes
      }
    });

  } catch (error) {
    console.error('Confirm 2FA error:', error);

    if (error.message === 'Invalid verification code') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to confirm 2FA'
    });
  }
};
