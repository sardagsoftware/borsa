// ============================================
// 🔵 GOOGLE OAUTH CALLBACK
// Vercel Serverless Function
// ============================================

const { saveUser, createSession } = require('../../../lib/auth/redis-session-store');

/**
 * Exchange Google OAuth code for tokens
 */
async function exchangeCodeForTokens(code, redirectUri) {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('[Google OAuth] Token exchange failed:', errorData);
            throw new Error('Token exchange failed');
        }

        return await response.json();
    } catch (error) {
        console.error('[Google OAuth] Error exchanging code:', error.message);
        throw error;
    }
}

/**
 * Get user info from Google
 */
async function getUserInfo(accessToken) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return await response.json();
    } catch (error) {
        console.error('[Google OAuth] Error getting user info:', error.message);
        throw error;
    }
}

/**
 * Main callback handler
 */
module.exports = async (req, res) => {
    try {
        const { code, error, state } = req.query;

        if (error) {
            console.error('[Google OAuth] Error from Google:', error);
            return res.redirect(`/auth.html?error=oauth_${error}&provider=google`);
        }

        if (!code) {
            return res.redirect('/auth.html?error=no_code&provider=google');
        }

        console.log('[Google OAuth] Received authorization code');

        // Exchange code for tokens
        const redirectUri = process.env.GOOGLE_CALLBACK_URL ||
                          `https://${req.headers.host}/api/auth/google/callback`;

        const tokens = await exchangeCodeForTokens(code, redirectUri);

        console.log('[Google OAuth] Tokens received');

        // Get user info
        const userInfo = await getUserInfo(tokens.access_token);

        console.log('[Google OAuth] User info received:', userInfo.email);

        // Save user to Redis
        const user = await saveUser({
            id: `google_${userInfo.id}`,
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.picture,
            provider: 'google',
            emailVerified: userInfo.verified_email
        });

        // Create session
        const sessionId = await createSession(user.id, {
            provider: 'google',
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            emailVerified: userInfo.verified_email
        });

        console.log('[Google OAuth] Session created:', sessionId);

        // Set session cookie
        res.setHeader('Set-Cookie', [
            `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
            `userId=${user.id}; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
            `userName=${encodeURIComponent(user.name)}; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`
        ]);

        // Redirect to dashboard or home
        return res.redirect('/dashboard.html?login=success');

    } catch (error) {
        console.error('[Google OAuth Callback] Error:', error.message);
        return res.redirect('/auth.html?error=oauth_failed&provider=google');
    }
};
