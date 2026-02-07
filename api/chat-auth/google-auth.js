/**
 * Google OAuth - Initiate Flow
 * GET /api/chat-auth/google-auth
 * Redirects to Google consent screen with CSRF state token
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    if (!GOOGLE_CLIENT_ID) {
      console.error('[GOOGLE_AUTH] GOOGLE_CLIENT_ID not configured');
      return res.redirect(302, '/chat?error=google_not_configured');
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in cookie (5 min TTL)
    const isProduction = process.env.NODE_ENV === 'production';
    const stateCookie = `oauth_state=${state}; Max-Age=300; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Lax`;
    res.setHeader('Set-Cookie', stateCookie);

    // Build Google OAuth URL
    const redirectUri = `https://www.ailydian.com/api/chat-auth/google-callback`;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    console.log('[GOOGLE_AUTH] Redirecting to Google consent screen');
    return res.redirect(302, authUrl.toString());
  } catch (error) {
    console.error('[GOOGLE_AUTH] Error:', error.message);
    return res.redirect(302, '/chat?error=google_init_failed');
  }
};
