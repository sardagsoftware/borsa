/**
 * User logout endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Properly destroy sessions and tokens
 */

const User = require('../../backend/models/User');
const jwt = require('jsonwebtoken');

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
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/auth_token=([^;]+)/);
    const sessionIdMatch = cookies.match(/session_id=([^;]+)/);

    if (tokenMatch) {
      try {
        const decoded = jwt.verify(
          tokenMatch[1],
          process.env.JWT_SECRET || 'your-secret-key-change-this'
        );
        userId = decoded.id;
      } catch (jwtError) {
        // Token invalid or expired - continue with logout anyway
        console.log('[Logout] Invalid JWT token');
      }
    }

    // Delete session from database
    if (sessionIdMatch || tokenMatch) {
      try {
        const { getDatabase } = require('../../database/init-db');
        const db = getDatabase();
        try {
          if (sessionIdMatch) {
            db.prepare('DELETE FROM sessions WHERE sessionId = ?').run(sessionIdMatch[1]);
          }
          if (tokenMatch) {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(tokenMatch[1]);
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

    // 🔒 SECURITY: Clear all authentication cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const clearCookieOptions = `HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`;

    res.setHeader('Set-Cookie', [
      `auth_token=; ${clearCookieOptions}`,
      `session_id=; ${clearCookieOptions}`,
      `lydian.sid=; ${clearCookieOptions}` // Express session cookie
    ]);

    console.log(`[Logout] User ${userId || 'unknown'} logged out successfully`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[Logout] Error:', error.message);

    // 🔒 SECURITY: Still clear cookies even if something fails
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const clearCookieOptions = `HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`;

    res.setHeader('Set-Cookie', [
      `auth_token=; ${clearCookieOptions}`,
      `session_id=; ${clearCookieOptions}`,
      `lydian.sid=; ${clearCookieOptions}`
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out'
    });
  }
};
