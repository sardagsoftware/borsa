/**
 * Email Verification API
 * Handles email verification for user accounts
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../backend/models/User');
const { authenticateToken } = require('../../backend/middleware/auth');
const { getDatabase } = require('../../database/init-db');
const { sendVerificationEmail } = require('../../backend/email-service');
const { applySanitization } = require('../_middleware/sanitize');

/**
 * POST /api/email/send-verification
 * Send verification email
 */
router.post('/send-verification', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    const db = getDatabase();
    try {
      // Delete any existing unused tokens
      db.prepare('DELETE FROM email_verification WHERE userId = ? AND used = 0').run(user.id);

      // Create new token
      db.prepare(`
        INSERT INTO email_verification (userId, token, expiresAt)
        VALUES (?, ?, ?)
      `).run(user.id, token, expiresAt.toISOString());

    } finally {
      db.close();
    }

    // Send email
    await sendVerificationEmail(user, token);

    User.logActivity({
      userId: user.id,
      action: 'verification_email_sent',
      description: 'Email verification sent'
    });

    res.json({
      success: true,
      message: 'Verification email sent'
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }
});

/**
 * GET /api/email/verify/:token
 * Verify email with token
 */
router.get('/verify/:token', async (req, res) => {
  applySanitization(req, res);
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Failed</h1>
            <p>Invalid verification token.</p>
            <a href="/login.html">Go to Login</a>
          </div>
        </body>
        </html>
      `);
    }

    const db = getDatabase();
    try {
      // Find verification token
      const verification = db.prepare(`
        SELECT * FROM email_verification
        WHERE token = ? AND used = 0 AND expiresAt > datetime('now')
      `).get(token);

      if (!verification) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
              .container { background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Verification Failed</h1>
              <p>Invalid or expired verification token.</p>
              <a href="/login.html">Go to Login</a>
            </div>
          </body>
          </html>
        `);
      }

      // Mark email as verified
      db.prepare('UPDATE users SET emailVerified = 1 WHERE id = ?').run(verification.userId);

      // Mark token as used
      db.prepare('UPDATE email_verification SET used = 1 WHERE id = ?').run(verification.id);

      User.logActivity({
        userId: verification.userId,
        action: 'email_verified',
        description: 'Email address verified'
      });

      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px; }
            .success { color: #28a745; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Email Verified!</h1>
            <p>Your email has been successfully verified. You can now access all features.</p>
            <a href="/dashboard.html" class="button">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; text-align: center; max-width: 500px; }
          .error { color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Error</h1>
          <p>An error occurred during verification.</p>
          <a href="/login.html">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * POST /api/email/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', authenticateToken, async (req, res) => {
  applySanitization(req, res);
  try {
    // Reuse the send-verification logic
    return router.handle({ ...req, url: '/send-verification', method: 'POST' }, res);

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification email'
    });
  }
});

module.exports = router;
