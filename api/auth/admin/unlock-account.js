/**
 * Admin Account Unlock Endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Admin can manually unlock user accounts
 */

const User = require('../../../backend/models/User');
const { resetFailedLogin } = require('../../../middleware/security-rate-limiters');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 🔒 BEYAZ ŞAPKALI: Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // 🔒 SECURITY: Check if user is admin
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { email, userId } = req.body;

    if (!email && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Email or userId is required'
      });
    }

    // Find user to unlock
    let targetUser;
    if (userId) {
      const { getDatabase } = require('../../../database/init-db');
const { handleCORS } = require('../../../middleware/cors-handler');
      const db = getDatabase();
      try {
        targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      } finally {
        db.close();
      }
    } else {
      targetUser = await User.findByEmail(email.toLowerCase().trim());
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Reset failed login attempts
    await resetFailedLogin(targetUser.email);

    // Log admin action
    User.logActivity({
      userId: decoded.id, // Admin user
      action: 'admin_account_unlock',
      description: `Admin unlocked account for user ${targetUser.email}`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email
      }
    });

    // Log activity for target user as well
    User.logActivity({
      userId: targetUser.id,
      action: 'account_unlocked_by_admin',
      description: `Account unlocked by admin ${decoded.email}`,
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: {
        adminUserId: decoded.id,
        adminEmail: decoded.email
      }
    });

    return res.status(200).json({
      success: true,
      message: `Account unlocked successfully for ${targetUser.email}`,
      data: {
        userId: targetUser.id,
        email: targetUser.email
      }
    });

  } catch (error) {
    console.error('Account unlock error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlock account'
    });
  }
};
