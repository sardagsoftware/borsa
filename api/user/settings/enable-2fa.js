/**
 * Enable Two-Factor Authentication
 * Generates QR code and secret for user
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const { handleCORS } = require('../../../middleware/cors-handler');
const { applySanitization } = require('../../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 🔒 SECURITY: Get user from auth token (httpOnly cookie)
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Please disable it first.'
      });
    }

    // Generate 2FA secret and QR code
    const twoFactorData = User.enableTwoFactor(userId);

    // Log activity
    User.logActivity({
      userId,
      action: '2fa_setup_initiated',
      description: '2FA setup initiated by user'
    });

    return res.status(200).json({
      success: true,
      message: 'Scan the QR code with your authenticator app',
      data: {
        secret: twoFactorData.secret,
        qrCodeUrl: twoFactorData.qrCode
      }
    });

  } catch (error) {
    console.error('Enable 2FA error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to enable 2FA'
    });
  }
};
