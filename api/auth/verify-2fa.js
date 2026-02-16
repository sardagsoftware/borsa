/**
 * Verify 2FA token
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Complete login after 2FA verification + Rate limiting
 */

const User = require('../../backend/models/User');
const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { twoFARateLimit } = require('../../middleware/security-rate-limiters');
const { sendLoginNotificationEmail } = require('../../lib/email-service');

module.exports = async (req, res) => {
  // 🔒 BEYAZ ŞAPKALI: Apply rate limiting FIRST
  await new Promise((resolve, reject) => {
    twoFARateLimit(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(error => {
    // Rate limit exceeded - twoFARateLimit already sent response
    return;
  });

  // Apply secure CORS
  if (handleCORS(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and token are required'
      });
    }

    // 🔒 SECURITY: Validate token format
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Get user with full data (need twoFactorSecret)
    const { getDatabase } = require('../../database/init-db');
    const db = getDatabase();
    let user;
    try {
      user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(userId, 'active');
    } finally {
      db.close();
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: '2FA not enabled for this user'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps (60 seconds) tolerance
    });

    if (!verified) {
      // Log failed 2FA attempt
      User.logActivity({
        userId: user.id,
        action: '2fa_failed',
        description: 'Failed 2FA verification attempt',
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Generate JWT token
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
        subscription: user.subscription || 'free'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 🔒 BEYAZ ŞAPKALI: Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create session in database
    try {
      const db2 = getDatabase();
      try {
        db2.prepare(`
          INSERT INTO sessions (userId, token, sessionId, ipAddress, userAgent, expiresAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          user.id,
          jwtToken,
          sessionId,
          req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          req.headers['user-agent'] || 'unknown',
          expiresAt.toISOString()
        );
      } finally {
        db2.close();
      }
    } catch (dbError) {
      console.error('Session creation error:', dbError);
      // Continue anyway - JWT is still valid
    }

    // 🔒 SECURITY: Set httpOnly cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const cookieOptions = `HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;

    res.setHeader('Set-Cookie', [
      `auth_token=${jwtToken}; ${cookieOptions}`,
      `session_id=${sessionId}; ${cookieOptions}`
    ]);

    // Log successful 2FA login
    User.logActivity({
      userId: user.id,
      action: 'user_login_2fa',
      description: 'User logged in with 2FA',
      ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // 🔒 BEYAZ ŞAPKALI: Send login notification for new IP
    try {
      const currentIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
      const { getDatabase } = require('../../database/init-db');
const { handleCORS } = require('../../middleware/cors-handler');
      const db3 = getDatabase();

      try {
        const recentLogin = db3.prepare(`
          SELECT * FROM sessions
          WHERE userId = ? AND ipAddress = ?
          AND createdAt > datetime('now', '-30 days')
          ORDER BY createdAt DESC
          LIMIT 1
        `).get(user.id, currentIp);

        if (!recentLogin) {
          const userAgent = req.headers['user-agent'] || 'Unknown';
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
          }

          sendLoginNotificationEmail(user, {
            ipAddress: currentIp,
            userAgent,
            timestamp: new Date().toISOString(),
            device,
            browser,
            location: 'Unknown'
          }).catch(err => console.error('Failed to send login notification:', err.message));

          console.log(`[2FA] Login notification sent for uid=${user.id}`);
        }
      } finally {
        db3.close();
      }
    } catch (error) {
      console.error('Login notification check error:', error.message);
    }

    return res.status(200).json({
      success: true,
      message: '2FA verification successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          subscription: user.subscription || 'free',
          credits: user.credits || 0
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
