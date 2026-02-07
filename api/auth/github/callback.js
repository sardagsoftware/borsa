/**
 * GitHub OAuth Callback
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - OAuth authentication with database persistence + Rate limiting
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { oauthCallbackRateLimit } = require('../../../middleware/security-rate-limiters');
const { sendLoginNotificationEmail } = require('../../../lib/email-service');

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
 * Find or create user from GitHub OAuth
 */
async function findOrCreateUser(userInfo, emailInfo, tokens) {
    const { getDatabase } = require('../../../database/init-db');
    const db = getDatabase();

    try {
        // Determine email (GitHub might not always provide it)
        const email = emailInfo?.email || `${userInfo.login}@users.noreply.github.com`;
        const emailVerified = emailInfo?.verified || false;

        // 🔒 BEYAZ ŞAPKALI: Check if user exists by email or githubId
        let user = db.prepare(`
            SELECT * FROM users
            WHERE email = ? OR githubId = ?
        `).get(email.toLowerCase(), userInfo.id.toString());

        if (user) {
            // Update existing user with GitHub info
            db.prepare(`
                UPDATE users SET
                    githubId = ?,
                    avatar = ?,
                    lastLogin = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                userInfo.id.toString(),
                userInfo.avatar_url || user.avatar,
                user.id
            );

            console.log(`[GitHub OAuth] Existing user updated: ${user.email}`);
        } else {
            // Create new user
            const result = db.prepare(`
                INSERT INTO users (
                    email, name, githubId, avatar, emailVerified,
                    subscription, credits, status, role
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                email.toLowerCase(),
                userInfo.name || userInfo.login,
                userInfo.id.toString(),
                userInfo.avatar_url,
                emailVerified ? 1 : 0,
                'free',
                100, // Initial credits
                'active',
                'USER'
            );

            user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

            console.log(`[GitHub OAuth] New user created: ${user.email}`);

            // Create initial usage stats
            db.prepare(`
                INSERT INTO usage_stats (userId, date)
                VALUES (?, CURRENT_DATE)
            `).run(user.id);
        }

        return user;
    } finally {
        db.close();
    }
}

/**
 * Main callback handler
 */
module.exports = async (req, res) => {
    // 🔒 BEYAZ ŞAPKALI: Apply OAuth callback rate limiting FIRST
    await new Promise((resolve, reject) => {
        oauthCallbackRateLimit(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    }).catch(() => {
        return; // Rate limit response already sent (redirect)
    });

    try {
        const { code, error } = req.query;

        // 🔒 SECURITY: Handle OAuth errors
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

        console.log('[GitHub OAuth] ✓ Tokens received');

        // Get user info from GitHub
        const userInfo = await getUserInfo(tokens.access_token);
        const emailInfo = await getUserEmails(tokens.access_token);

        console.log('[GitHub OAuth] ✓ User info received:', userInfo.login);

        // 🔒 BEYAZ ŞAPKALI: Find or create user in database
        const user = await findOrCreateUser(userInfo, emailInfo, tokens);

        // 🔒 BEYAZ ŞAPKALI: Generate JWT token
        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role || 'USER',
                subscription: user.subscription || 'free',
                provider: 'github'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 🔒 BEYAZ ŞAPKALI: Generate session ID
        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Create session in database
        const { getDatabase } = require('../../../database/init-db');
        const db = getDatabase();
        try {
            db.prepare(`
                INSERT INTO sessions (
                    userId, token, sessionId, ipAddress, userAgent, expiresAt,
                    provider, oauthAccessToken
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                user.id,
                jwtToken,
                sessionId,
                req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
                req.headers['user-agent'] || 'unknown',
                expiresAt.toISOString(),
                'github',
                tokens.access_token
            );
        } finally {
            db.close();
        }

        console.log('[GitHub OAuth] ✓ Session created:', sessionId);

        // 🔒 SECURITY: Log OAuth login activity
        User.logActivity({
            userId: user.id,
            action: 'oauth_login',
            description: 'User logged in via GitHub OAuth',
            ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: { provider: 'github', githubUsername: userInfo.login }
        });

        // 🔒 BEYAZ ŞAPKALI: Send login notification for new IP
        try {
            const currentIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
            const db2 = getDatabase();
            try {
                const recentLogin = db2.prepare(`
                    SELECT * FROM sessions
                    WHERE userId = ? AND ipAddress = ?
                    AND createdAt > datetime('now', '-30 days')
                    ORDER BY createdAt DESC
                    LIMIT 1
                `).get(user.id, currentIp);

                if (!recentLogin) {
                    const userAgent = req.headers['user-agent'] || 'Unknown';
                    let device = 'Unknown Device';
                    let browser = 'Unknown Browser';

                    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
                        device = 'Mobile Device';
                    } else if (userAgent.includes('iPad') || userAgent.includes('iPhone')) {
                        device = 'iOS Device';
                    } else if (userAgent.includes('Macintosh')) {
                        device = 'Mac Computer';
                    } else if (userAgent.includes('Windows')) {
                        device = 'Windows Computer';
                    } else if (userAgent.includes('Linux')) {
                        device = 'Linux Computer';
                    }

                    if (userAgent.includes('Chrome')) {
                        browser = 'Google Chrome';
                    } else if (userAgent.includes('Firefox')) {
                        browser = 'Mozilla Firefox';
                    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
                        browser = 'Safari';
                    } else if (userAgent.includes('Edge')) {
                        browser = 'Microsoft Edge';
                    }

                    sendLoginNotificationEmail(user, {
                        ipAddress: currentIp,
                        userAgent,
                        timestamp: new Date().toISOString(),
                        device,
                        browser,
                        location: 'Unknown'
                    }).catch(err => console.error('Failed to send login notification:', err.message));

                    console.log(`[GitHub OAuth] Login notification sent to ${user.email}`);
                }
            } finally {
                db2.close();
            }
        } catch (error) {
            console.error('Login notification check error:', error.message);
        }

        // 🔒 SECURITY: Set httpOnly cookies (dual strategy)
        const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
        const cookieOptions = `HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;

        res.setHeader('Set-Cookie', [
            `auth_token=${jwtToken}; ${cookieOptions}`,
            `session_id=${sessionId}; ${cookieOptions}`
        ]);

        // Redirect to dashboard with success
        console.log(`[GitHub OAuth] ✓ Login successful for ${user.email}`);
        return res.redirect('/dashboard.html?login=success&provider=github');

    } catch (error) {
        console.error('[GitHub OAuth Callback] ❌ Error:', error.message);
        console.error(error.stack);
        return res.redirect('/auth.html?error=oauth_failed&provider=github');
    }
};
