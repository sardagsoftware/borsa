/**
 * Password Reset API
 * Handles password reset requests and verification
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../../backend/models/User');
const { getDatabase } = require('../../database/init-db');
const { sendPasswordResetEmail } = require('../../backend/email-service');

/**
 * POST /api/password-reset/request
 * Request password reset
 */
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find user
    const user = User.findByEmail(email.toLowerCase().trim());

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const db = getDatabase();
    try {
      // Delete any existing unused tokens
      db.prepare('DELETE FROM password_reset WHERE userId = ? AND used = 0').run(user.id);

      // Create new token
      db.prepare(`
        INSERT INTO password_reset (userId, token, expiresAt)
        VALUES (?, ?, ?)
      `).run(user.id, token, expiresAt.toISOString());

    } finally {
      db.close();
    }

    // Send email
    await sendPasswordResetEmail(user, token);

    User.logActivity({
      userId: user.id,
      action: 'password_reset_requested',
      description: 'Password reset requested'
    });

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
});

/**
 * GET /api/password-reset/verify/:token
 * Verify reset token (check if valid)
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const db = getDatabase();
    try {
      const reset = db.prepare(`
        SELECT * FROM password_reset
        WHERE token = ? AND used = 0 AND expiresAt > datetime('now')
      `).get(token);

      if (!reset) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid'
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token'
    });
  }
});

/**
 * POST /api/password-reset/reset
 * Reset password with token
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // 🔒 SECURITY: Beyaz Şapkalı Password Validation
    const passwordValidation = User.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    const db = getDatabase();
    try {
      // Find and validate token
      const reset = db.prepare(`
        SELECT * FROM password_reset
        WHERE token = ? AND used = 0 AND expiresAt > datetime('now')
      `).get(token);

      if (!reset) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, reset.userId);

      // Mark token as used
      db.prepare('UPDATE password_reset SET used = 1 WHERE id = ?').run(reset.id);

      // Invalidate all sessions for this user
      db.prepare('DELETE FROM sessions WHERE userId = ?').run(reset.userId);

      User.logActivity({
        userId: reset.userId,
        action: 'password_reset_completed',
        description: 'Password successfully reset'
      });

      res.json({
        success: true,
        message: 'Password reset successfully. Please login with your new password.'
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

module.exports = router;
