/**
 * Microsoft OAuth - Vercel Serverless Function
 * Endpoint: /api/auth/microsoft
 */
const { applySanitization } = require('../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  try {
    const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
    const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || `${process.env.VERCEL_URL || 'https://www.ailydian.com'}/api/auth/microsoft/callback`;

    if (!MICROSOFT_CLIENT_ID) {
      return res.redirect(302, '/auth.html?error=oauth_not_configured&provider=microsoft');
    }

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', MICROSOFT_REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile User.Read');
    authUrl.searchParams.set('response_mode', 'query');

    res.redirect(302, authUrl.toString());
  } catch (error) {
    console.error('❌ Microsoft OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth initialization failed'
    });
  }
};
