/**
 * GitHub OAuth - Vercel Serverless Function
 * Endpoint: /api/auth/github
 */

module.exports = async (req, res) => {
  try {
    const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
    const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:5001'}/api/auth/github/callback`;

    if (!GITHUB_CLIENT_ID) {
      return res.redirect(302, '/auth.html?error=oauth_not_configured&provider=github');
    }

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('allow_signup', 'true');

    res.redirect(302, authUrl.toString());
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth initialization failed'
    });
  }
};
