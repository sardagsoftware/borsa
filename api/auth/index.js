/**
 * Authentication API Routes
 * Handles user registration, login, 2FA, and session management
 */

require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../../backend/models/User');
const { authenticateToken } = require('../../backend/middleware/auth');
const { applySanitization } = require('../_middleware/sanitize');

router.use((req, res, next) => {
  applySanitization(req, res);
  next();
});

/**
 * POST /api/auth/check-email
 * Check if email exists in database
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const user = await User.findByEmail(email.toLowerCase().trim());

    res.json({
      success: true,
      exists: !!user,
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    // Create user
    const user = await User.createUser({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      phone: phone ? phone.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(400).json({
      success: false,
      error: 'Kayit basarisiz. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Attempt login
    const result = await User.login({
      email: email.toLowerCase().trim(),
      password,
      ipAddress,
      userAgent,
    });

    // If 2FA is required
    if (result.requiresTwoFactor) {
      return res.json({
        success: true,
        requiresTwoFactor: true,
        userId: result.userId,
        message: 'Please enter your two-factor authentication code',
      });
    }

    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(401).json({
      success: false,
      error: 'Giris basarisiz. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/auth/verify-2fa
 * Verify two-factor authentication code
 */
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: 'User ID and code are required',
      });
    }

    // Get client info
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Verify 2FA
    const result = await User.verifyTwoFactor({
      userId: parseInt(userId),
      code: code.trim(),
      ipAddress,
      userAgent,
    });

    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Two-factor verification successful',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    console.error('2FA verification error:', error);

    res.status(401).json({
      success: false,
      error: 'Dogrulama hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/auth/enable-2fa
 * Enable two-factor authentication
 */
router.post('/enable-2fa', authenticateToken, async (req, res) => {
  try {
    const result = User.enableTwoFactor(req.user.id);

    res.json({
      success: true,
      message: 'Two-factor authentication setup initiated',
      secret: result.secret,
      qrCode: result.qrCode,
    });
  } catch (error) {
    console.error('2FA enable error:', error);

    res.status(500).json({
      success: false,
      error: '2FA etkinlestirme hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/auth/confirm-2fa
 * Confirm and activate two-factor authentication
 */
router.post('/confirm-2fa', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
    }

    const result = User.confirmTwoFactor(req.user.id, code.trim());

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('2FA confirm error:', error);

    res.status(400).json({
      success: false,
      error: 'Dogrulama hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userWithStats = User.getUserWithStats(req.user.id);

    if (!userWithStats) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: userWithStats,
    });
  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;

    const user = User.updateProfile(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Profile update error:', error);

    res.status(400).json({
      success: false,
      error: 'Profil guncelleme hatasi. Lutfen tekrar deneyin.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate session
    User.logout(req.token);

    // Clear cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const decoded = User.verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    const user = User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Generate new tokens
    const token = User.generateToken(user);
    const newRefreshToken = User.generateRefreshToken(user);

    res.json({
      success: true,
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);

    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
    });
  }
});

/**
 * GET /api/auth/activity
 * Get user activity log
 */
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { getDatabase } = require('../../database/init-db');
    const db = getDatabase();

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const activities = db
      .prepare(
        `
      SELECT action, description, ipAddress, createdAt
      FROM activity_log
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `
      )
      .all(req.user.id, limit, offset);

    db.close();

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Activity log error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to get activity log',
    });
  }
});

module.exports = router;
