// ============================================
// 🐙 GITHUB OAUTH CALLBACK
// Vercel Serverless Function
// ============================================

const { saveUser, createSession } = require('../../../lib/auth/redis-session-store');

/**
 * Exchange GitHub OAuth code for tokens
 */
async function exchangeCodeForTokens(code) {
    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            })
        });

        if (!response.ok) {
            throw new Error('Token exchange failed');
        }

        return await response.json();
    } catch (error) {
        console.error('[GitHub OAuth] Error exchanging code:', error.message);
        throw error;
    }
}

/**
 * Get user info from GitHub
 */
async function getUserInfo(accessToken) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get user info');
        }

        return await response.json();
    } catch (error) {
        console.error('[GitHub OAuth] Error getting user info:', error.message);
        throw error;
    }
}

/**
 * Get user emails from GitHub
 */
async function getUserEmails(accessToken) {
    try {
        const response = await fetch('https://api.github.com/user/emails', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            return [];
        }

        const emails = await response.json();
        const primaryEmail = emails.find(e => e.primary) || emails[0];
        return primaryEmail;
    } catch (error) {
        console.error('[GitHub OAuth] Error getting emails:', error.message);
        return null;
    }
}

/**
 * Main callback handler
 */
module.exports = async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            console.error('[GitHub OAuth] Error from GitHub:', error);
            return res.redirect(`/auth.html?error=oauth_${error}&provider=github`);
        }

        if (!code) {
            return res.redirect('/auth.html?error=no_code&provider=github');
        }

        console.log('[GitHub OAuth] Received authorization code');

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        console.log('[GitHub OAuth] Tokens received');

        // Get user info
        const userInfo = await getUserInfo(tokens.access_token);
        const emailInfo = await getUserEmails(tokens.access_token);

        console.log('[GitHub OAuth] User info received:', userInfo.login);

        const email = emailInfo?.email || `${userInfo.login}@github.local`;

        // Save user to Redis
        const user = await saveUser({
            id: `github_${userInfo.id}`,
            email: email,
            name: userInfo.name || userInfo.login,
            avatarUrl: userInfo.avatar_url,
            provider: 'github',
            githubUsername: userInfo.login
        });

        // Create session
        const sessionId = await createSession(user.id, {
            provider: 'github',
            accessToken: tokens.access_token,
            githubUsername: userInfo.login
        });

        console.log('[GitHub OAuth] Session created:', sessionId);

        // Set session cookie
        res.setHeader('Set-Cookie', [
            `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
            `userId=${user.id}; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
            `userName=${encodeURIComponent(user.name)}; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`
        ]);

        // Redirect to dashboard or home
        return res.redirect('/dashboard.html?login=success');

    } catch (error) {
        console.error('[GitHub OAuth Callback] Error:', error.message);
        return res.redirect('/auth.html?error=oauth_failed&provider=github');
    }
};
