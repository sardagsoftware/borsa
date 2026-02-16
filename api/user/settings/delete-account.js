/**
 * Delete User Account
 * GDPR compliance - Right to be forgotten
 * Requires password confirmation
 * Vercel Serverless Function
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../../../database/init-db');
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get password and confirmation from request
    const { password, confirmation } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // 🔒 SECURITY: Require user to type "DELETE" to confirm
    if (confirmation !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Please type DELETE to confirm account deletion'
      });
    }

    // Get user with password hash
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

    // Log activity before deletion
    User.logActivity({
      userId,
      action: 'account_deletion_requested',
      description: 'User requested account deletion'
    });

    // Start transaction-like deletion
    // Delete related data first (foreign key constraints)
    db.prepare('DELETE FROM user_privacy WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM api_keys WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM sessions WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM usage_stats WHERE userId = ?').run(userId);
    db.prepare('DELETE FROM activity_log WHERE userId = ?').run(userId);

    // Finally, delete the user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    // Clear auth cookie
    res.setHeader('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');

    return res.status(200).json({
      success: true,
      message: 'Your account has been permanently deleted. We\'re sorry to see you go.'
    });

  } catch (error) {
    console.error('Delete account error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete account. Please contact support.'
    });
  } finally {
    db.close();
  }
};
