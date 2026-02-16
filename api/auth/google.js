/**
 * Google OAuth - Vercel Serverless Function
 * Endpoint: /api/auth/google
 */
const { applySanitization } = require('../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.VERCEL_URL || 'https://www.ailydian.com'}/api/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      return res.redirect(302, '/auth.html?error=oauth_not_configured&provider=google');
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    res.redirect(302, authUrl.toString());
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth initialization failed'
    });
  }
};
