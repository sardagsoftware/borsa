/**
 * Refresh token endpoint
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - Silent token refresh for httpOnly cookies
 */

const jwt = require('jsonwebtoken');
const { getCookie, setAuthCookies } = require('../../middleware/cookie-auth');

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
    // 🔒 BEYAZ ŞAPKALI: Get refresh token from httpOnly cookie
    const refreshToken = getCookie(req, 'refresh_token');

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token',
        message: 'Please log in again',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || 'your-secret-key-change-this',
        {
          issuer: 'LyDian-Platform',
          audience: 'LyDian-API'
        }
      );
    } catch (jwtError) {
      console.error('[Refresh] Invalid refresh token:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Please log in again',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }

    // 🔒 SECURITY: Verify it's actually a refresh token
    if (decoded.type !== 'refresh') {
      console.error('[Refresh] Token is not a refresh token');
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        message: 'Please log in again',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // 🔒 BEYAZ ŞAPKALI: Generate new access token (15 minutes)
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
        subscription: decoded.subscription || 'free'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      {
        expiresIn: '15m',
        issuer: 'LyDian-Platform',
        audience: 'LyDian-API'
      }
    );

    // 🔒 SECURITY: Set new access token cookie (keep same refresh token)
    setAuthCookies(res, newAccessToken, refreshToken);

    console.log(`[Refresh] Token refreshed for user ${decoded.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('[Refresh] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Token refresh failed'
    });
  }
};
