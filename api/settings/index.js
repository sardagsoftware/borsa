/**
 * Settings API
 * Handles user profile, 2FA, API keys, and preferences
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../../backend/models/User');
const { authenticateToken } = require('../../backend/middleware/auth');
const { getDatabase } = require('../../database/init-db');
const { send2FAEnabledEmail } = require('../../backend/email-service');
const { applySanitization } = require('../_middleware/sanitize');

/**
 * GET /api/settings/profile
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const user = User.getUserWithStats(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

/**
 * PUT /api/settings/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const updates = req.body;

    // Validate email if being updated
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      // Check if email already exists
      const existing = User.findByEmail(updates.email);
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
    }

    const user = User.updateProfile(req.user.id, updates);

    User.logActivity({
      userId: req.user.id,
      action: 'profile_updated',
      description: 'User updated profile',
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: 'Profil guncelleme hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/settings/password
 * Change password
 */
router.post('/password', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
    }

    const db = getDatabase();
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, req.user.id);

      User.logActivity({
        userId: req.user.id,
        action: 'password_changed',
        description: 'User changed password',
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

/**
 * GET /api/settings/2fa-status
 * Get 2FA status
 */
router.get('/2fa-status', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const db = getDatabase();
    try {
      const user = db.prepare('SELECT twoFactorEnabled FROM users WHERE id = ?').get(req.user.id);

      res.json({
        success: true,
        enabled: Boolean(user.twoFactorEnabled),
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get 2FA status',
    });
  }
});

/**
 * POST /api/settings/2fa-enable
 * Enable 2FA
 */
router.post('/2fa-enable', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const result = User.enableTwoFactor(req.user.id);

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(result.qrCode);

    res.json({
      success: true,
      message: 'Scan this QR code with your authenticator app',
      secret: result.secret,
      qrCode: qrCodeDataURL,
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable 2FA',
    });
  }
});

/**
 * POST /api/settings/2fa-confirm
 * Confirm 2FA setup
 */
router.post('/2fa-confirm', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
    }

    User.confirmTwoFactor(req.user.id, code.trim());

    User.logActivity({
      userId: req.user.id,
      action: 'two_factor_enabled',
      description: 'Two-factor authentication enabled',
    });

    // Send email notification
    try {
      const user = User.findById(req.user.id);
      await send2FAEnabledEmail(user);
    } catch (emailError) {
      console.error('Failed to send 2FA email:', emailError);
    }

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('Confirm 2FA error:', error);
    res.status(400).json({
      success: false,
      error: 'Dogrulama hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/settings/2fa-disable
 * Disable 2FA
 */
router.post('/2fa-disable', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to disable 2FA',
      });
    }

    const db = getDatabase();
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Incorrect password',
        });
      }

      // Disable 2FA
      db.prepare('UPDATE users SET twoFactorEnabled = 0, twoFactorSecret = NULL WHERE id = ?').run(
        req.user.id
      );

      User.logActivity({
        userId: req.user.id,
        action: 'two_factor_disabled',
        description: 'Two-factor authentication disabled',
      });

      res.json({
        success: true,
        message: 'Two-factor authentication disabled',
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable 2FA',
    });
  }
});

/**
 * GET /api/settings/api-keys
 * Get user's API keys
 */
router.get('/api-keys', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const db = getDatabase();
    try {
      const keys = db
        .prepare(
          `
        SELECT id, keyName, keyPrefix, permissions, lastUsed, expiresAt, createdAt, status
        FROM api_keys
        WHERE userId = ?
        ORDER BY createdAt DESC
      `
        )
        .all(req.user.id);

      res.json({
        success: true,
        keys,
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Get API keys error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get API keys',
    });
  }
});

/**
 * POST /api/settings/api-keys
 * Create new API key
 */
router.post('/api-keys', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const { keyName, permissions = 'read' } = req.body;

    if (!keyName) {
      return res.status(400).json({
        success: false,
        error: 'Key name is required',
      });
    }

    // Generate API key
    const apiKey = 'ak_' + crypto.randomBytes(32).toString('hex');
    const keyPrefix = apiKey.substring(0, 12) + '...';
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const db = getDatabase();
    try {
      db.prepare(
        `
        INSERT INTO api_keys (userId, keyName, keyHash, keyPrefix, permissions)
        VALUES (?, ?, ?, ?, ?)
      `
      ).run(req.user.id, keyName, keyHash, keyPrefix, permissions);

      User.logActivity({
        userId: req.user.id,
        action: 'api_key_created',
        description: `Created API key: ${keyName}`,
      });

      res.json({
        success: true,
        message: 'API key created successfully',
        apiKey: apiKey,
        warning: 'Save this key now. You will not be able to see it again!',
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Create API key error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
    });
  }
});

/**
 * DELETE /api/settings/api-keys/:id
 * Revoke API key
 */
router.delete('/api-keys/:id', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const keyId = parseInt(req.params.id);

    const db = getDatabase();
    try {
      const key = db
        .prepare('SELECT * FROM api_keys WHERE id = ? AND userId = ?')
        .get(keyId, req.user.id);

      if (!key) {
        return res.status(404).json({
          success: false,
          error: 'API key not found',
        });
      }

      db.prepare('DELETE FROM api_keys WHERE id = ?').run(keyId);

      User.logActivity({
        userId: req.user.id,
        action: 'api_key_revoked',
        description: `Revoked API key: ${key.keyName}`,
      });

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Revoke API key error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
    });
  }
});

module.exports = router;
