/**
 * Chat Auth Sessions API
 * GET /api/chat-auth/sessions - Get active sessions for user
 */

const { extractToken, verifyAccessToken } = require('./_lib/jwt');
const { parseCookies } = require('./_lib/cookies');
const { getCorsOrigin } = require('../_middleware/cors');

/**
 * Parse user agent string to extract browser and device info
 */
function parseUserAgent(ua) {
  let browser = 'Bilinmiyor';
  let device = 'desktop';

  if (!ua) return { browser, device };

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    device = /iPad/i.test(ua) ? 'tablet' : 'mobile';
  }

  if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome/i.test(ua) && !/Edg|OPR/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  }

  return { browser, device };
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse cookies
    req.cookies = parseCookies(req);

    // Extract and verify token
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Giriş yapmanız gerekli'
      });
    }

    const authResult = verifyAccessToken(token);

    if (!authResult.valid) {
      return res.status(401).json({
        success: false,
        error: 'Oturum süresi dolmuş'
      });
    }

    // Parse user agent from current request
    const userAgent = req.headers['user-agent'] || '';
    const { browser, device } = parseUserAgent(userAgent);

    // Return current session info
    // Sessions are keyed by refresh token, not indexed by user,
    // so we return the current session based on the request context
    const sessions = [
      {
        id: 'current',
        browser,
        device,
        current: true,
        location: 'Türkiye',
        lastActive: 'Şu an aktif'
      }
    ];

    return res.status(200).json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('[CHAT_AUTH_SESSIONS_ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Oturum bilgileri alınamadı'
    });
  }
};
