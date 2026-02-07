/**
 * Google OAuth Callback
 * GET /api/chat-auth/google-callback?code=...&state=...
 * Exchanges code for tokens, creates/finds user in Redis, sets JWT cookies
 */

const { chatUsers, chatSessions } = require('./_lib/db');
const { generateAccessToken, generateRefreshToken } = require('./_lib/jwt');
const { setAuthCookies, getCookie } = require('./_lib/cookies');
const { checkRateLimit } = require('./_lib/password');

module.exports = async function handler(req, res) {
  try {
    const { code, error, state } = req.query;

    // Handle OAuth errors from Google
    if (error) {
      console.error('[GOOGLE_CALLBACK] Error from Google:', error);
      return res.redirect(302, '/chat?error=google_denied');
    }

    if (!code) {
      return res.redirect(302, '/chat?error=google_no_code');
    }

    // Rate limiting
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
    const rateLimit = checkRateLimit(`google_oauth:${clientIP}`);
    if (!rateLimit.allowed) {
      return res.redirect(302, `/chat?error=rate_limit`);
    }

    // Verify CSRF state token
    const storedState = getCookie(req, 'oauth_state');
    if (!storedState || storedState !== state) {
      console.error('[GOOGLE_CALLBACK] State mismatch - possible CSRF attack');
      return res.redirect(302, '/chat?error=google_state_invalid');
    }

    // Clear state cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const clearStateCookie = `oauth_state=; Max-Age=0; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Lax`;

    // Exchange code for tokens
    const redirectUri = `https://www.ailydian.com/api/chat-auth/google-callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[GOOGLE_CALLBACK] Token exchange failed:', errorData);
      return res.redirect(302, '/chat?error=google_token_failed');
    }

    const tokens = await tokenResponse.json();
    console.log('[GOOGLE_CALLBACK] Token exchange successful');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      console.error('[GOOGLE_CALLBACK] Failed to get user info');
      return res.redirect(302, '/chat?error=google_userinfo_failed');
    }

    const googleUser = await userInfoResponse.json();
    console.log('[GOOGLE_CALLBACK] Google user:', googleUser.email);

    if (!googleUser.email) {
      return res.redirect(302, '/chat?error=google_no_email');
    }

    // Find or create user in chat-auth Redis system
    let user = await chatUsers.findByEmail(googleUser.email);

    if (user) {
      // Existing user - update last login, avatar, and mark Google as linked
      await chatUsers.updateLastLogin(user.id);
      await chatUsers.updateProfile(user.id, {
        avatarUrl: googleUser.picture || user.avatar_url,
        googleLinked: true
      });
      console.log('[GOOGLE_CALLBACK] Existing user logged in:', user.id);
    } else {
      // New user - create account (no password, OAuth-only)
      const displayName = googleUser.name || googleUser.email.split('@')[0];
      const userId = await chatUsers.create(
        googleUser.email,
        null, // No password for OAuth users
        displayName,
        {
          avatarUrl: googleUser.picture || '',
          authProvider: 'google'
        }
      );
      user = await chatUsers.findById(userId);
      console.log('[GOOGLE_CALLBACK] New user created:', userId);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session in Redis
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await chatSessions.create(
      user.id,
      refreshToken,
      expiresAt,
      clientIP,
      req.headers['user-agent'] || 'unknown'
    );

    // Set auth cookies + clear state cookie
    setAuthCookies(res, accessToken, refreshToken);
    const existing = res.getHeader('Set-Cookie') || [];
    const cookies = Array.isArray(existing) ? existing : [existing];
    res.setHeader('Set-Cookie', [...cookies, clearStateCookie]);

    console.log('[GOOGLE_CALLBACK] Login successful, redirecting to /chat');
    return res.redirect(302, '/chat');
  } catch (error) {
    console.error('[GOOGLE_CALLBACK] Error:', error.message);
    console.error(error.stack);
    return res.redirect(302, '/chat?error=google_failed');
  }
};
