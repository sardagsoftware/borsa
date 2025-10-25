/**
 * User logout endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Properly destroy sessions and tokens
 */

const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');
const { clearAuthCookies, getCookie } = require('../../middleware/cookie-auth');

module.exports = async (req, res) => {
  // CORS Headers
  const allowedOrigins = [
    'https://www.ailydian.com',
    'https://ailydian.com',
    'https://ailydian-ultra-pro.vercel.app',
    'http://localhost:3000',
    'http://localhost:3100'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let userId = null;

    // 🔒 BEYAZ ŞAPKALI: Extract user info from JWT token
    const authToken = getCookie(req, 'auth_token');
    const sessionId = getCookie(req, 'session_id');

    if (authToken) {
      try {
        const decoded = jwt.verify(
          authToken,
          process.env.JWT_SECRET || 'your-secret-key-change-this'
        );
        userId = decoded.userId || decoded.id;
      } catch (jwtError) {
        // Token invalid or expired - continue with logout anyway
        console.log('[Logout] Invalid JWT token');
      }
    }

    // Delete session from database
    if (sessionId || authToken) {
      try {
        const { getDatabase } = require('../../database/init-db');
        const db = getDatabase();
        try {
          if (sessionId) {
            db.prepare('DELETE FROM sessions WHERE sessionId = ?').run(sessionId);
          }
          if (authToken) {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(authToken);
          }
          // Also delete all sessions for this user
          if (userId) {
            db.prepare('DELETE FROM sessions WHERE userId = ? AND expiresAt < datetime("now", "+7 days")').run(userId);
          }
        } finally {
          db.close();
        }
      } catch (dbError) {
        console.error('[Logout] Database error:', dbError.message);
        // Continue with logout even if DB fails
      }
    }

    // Log logout activity
    if (userId) {
      User.logActivity({
        userId,
        action: 'user_logout',
        description: 'User logged out',
        ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    }

    // 🔒 SECURITY: Clear all authentication cookies (httpOnly + refresh + CSRF)
    clearAuthCookies(res);

    console.log(`[Logout] User ${userId || 'unknown'} logged out successfully`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[Logout] Error:', error.message);

    // 🔒 SECURITY: Still clear cookies even if something fails
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
};
