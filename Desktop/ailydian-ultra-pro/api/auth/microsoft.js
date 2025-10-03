/**
 * Microsoft OAuth - Vercel Serverless Function
 * Endpoint: /api/auth/microsoft
 */

module.exports = async (req, res) => {
  try {
    const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
    const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:5001'}/api/auth/microsoft/callback`;

    if (!MICROSOFT_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: 'Microsoft OAuth not configured'
      });
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
