/**
 * User login endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Session + JWT hybrid authentication + Account lockout
 */

const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { trackFailedLogin, resetFailedLogin, isAccountLocked } = require('../../middleware/security-rate-limiters');
const { sendAccountLockoutEmail, sendLoginNotificationEmail } = require('../../lib/email-service');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Check if account is locked (before database lookup)
    const lockStatus = await isAccountLocked(email.toLowerCase().trim());
    if (lockStatus.locked) {
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to too many failed login attempts. Try again in ${lockStatus.lockDuration} seconds.`,
        code: 'ACCOUNT_LOCKED',
        lockDuration: lockStatus.lockDuration
      });
    }

    // Find user
    const user = await User.findByEmail(email.toLowerCase().trim());

    if (!user) {
      // 🔒 SECURITY: Generic error message to prevent email enumeration
      // But still track as failed attempt
      await trackFailedLogin(email.toLowerCase().trim());

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 🔒 SECURITY: Check if user account is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password (fixed: user.passwordHash not user.password)
    const isValidPassword = await User.verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // 🔒 BEYAZ ŞAPKALI: Track failed login attempt
      const failedAttempt = await trackFailedLogin(email.toLowerCase().trim());

      // Log activity
      User.logActivity({
        userId: user.id,
        action: 'login_failed',
        description: 'Failed login attempt - invalid password',
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        metadata: {
          attemptsRemaining: failedAttempt.attemptsRemaining,
          locked: failedAttempt.locked
        }
      });

      // If account just got locked, inform user and send email notification
      if (failedAttempt.locked) {
        // 🔒 BEYAZ ŞAPKALI: Send lockout notification email (async, don't wait)
        sendAccountLockoutEmail(user, failedAttempt.lockDuration).catch(err => {
          console.error('Failed to send lockout email:', err.message);
        });

        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts. Your account has been locked for ${failedAttempt.lockDuration} seconds.`,
          code: 'ACCOUNT_LOCKED',
          lockDuration: failedAttempt.lockDuration
        });
      }

      // Return generic error with remaining attempts hint
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        attemptsRemaining: failedAttempt.attemptsRemaining
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Reset failed login attempts on successful login
    await resetFailedLogin(email.toLowerCase().trim());

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Don't create session yet, return userId for 2FA verification
      return res.status(200).json({
        success: true,
        data: {
          requiresTwoFactor: true,
          userId: user.id
        }
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Generate secure JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
        subscription: user.subscription || 'free'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    // 🔒 BEYAZ ŞAPKALI: Generate session ID for Redis
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create session in database (for Redis sync)
    try {
      const { getDatabase } = require('../../database/init-db');
      const db = getDatabase();
      try {
        db.prepare(`
          INSERT INTO sessions (userId, token, sessionId, ipAddress, userAgent, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          token,
          sessionId,
          req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          req.headers['user-agent'] || 'unknown',
          expiresAt.toISOString()
        );
      } finally {
        db.close();
      }
    } catch (dbError) {
      console.error('Session creation error:', dbError);
      // Continue anyway - JWT is still valid
    }

    // 🔒 SECURITY: Set httpOnly cookies (both session and JWT)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;

    res.setHeader('Set-Cookie', [
      `auth_token=${token}; ${cookieOptions}`,
      `session_id=${sessionId}; ${cookieOptions}`
    ]);

    // Log successful login
    User.logActivity({
      userId: user.id,
      action: 'user_login',
      description: 'User logged in successfully',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // 🔒 BEYAZ ŞAPKALI: Check if this is a new login (new IP/device)
    // Send notification email for security awareness
    try {
      const currentIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
      const { getDatabase } = require('../../database/init-db');
      const db = getDatabase();

      try {
        // Check if this IP has logged in within last 30 days
        const recentLogin = db.prepare(`
          SELECT * FROM sessions
          WHERE userId = ? AND ipAddress = ?
          AND createdAt > datetime('now', '-30 days')
          ORDER BY createdAt DESC
          LIMIT 1
        `).get(user.id, currentIp);

        // If no recent login from this IP, send notification
        if (!recentLogin) {
          const userAgent = req.headers['user-agent'] || 'Unknown';

          // Simple user agent parsing
          let device = 'Unknown Device';
          let browser = 'Unknown Browser';

          if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            device = 'Mobile Device';
          } else if (userAgent.includes('iPad') || userAgent.includes('iPhone')) {
            device = 'iOS Device';
          } else if (userAgent.includes('Macintosh')) {
            device = 'Mac Computer';
          } else if (userAgent.includes('Windows')) {
            device = 'Windows Computer';
          } else if (userAgent.includes('Linux')) {
            device = 'Linux Computer';
          }

          if (userAgent.includes('Chrome')) {
            browser = 'Google Chrome';
          } else if (userAgent.includes('Firefox')) {
            browser = 'Mozilla Firefox';
          } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
          } else if (userAgent.includes('Edge')) {
            browser = 'Microsoft Edge';
          } else if (userAgent.includes('Opera')) {
            browser = 'Opera';
          }

          // Send login notification email (async, don't block response)
          sendLoginNotificationEmail(user, {
            ipAddress: currentIp,
            userAgent,
            timestamp: new Date().toISOString(),
            device,
            browser,
            location: 'Unknown' // Could integrate with IP geolocation service
          }).catch(err => {
            console.error('Failed to send login notification email:', err.message);
          });

          console.log(`[Security] New login notification sent to ${user.email} for IP ${currentIp}`);
        }
      } finally {
        db.close();
      }
    } catch (error) {
      console.error('Login notification check error:', error.message);
      // Don't fail the login if notification fails
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        requiresTwoFactor: false,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          subscription: user.subscription || 'free',
          credits: user.credits || 0
        },
        // Include token for API clients
        token: token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
