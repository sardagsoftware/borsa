/**
 * Google OAuth Callback
 * Vercel Serverless Function
 * Beyaz Şapkalı Security - OAuth authentication with database persistence + Rate limiting
 */

const User = require('../../../backend/models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { oauthCallbackRateLimit } = require('../../../middleware/security-rate-limiters');
const { sendLoginNotificationEmail } = require('../../../lib/email-service');

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
 * Find or create user from Google OAuth
 */
async function findOrCreateUser(userInfo, tokens) {
    const { getDatabase } = require('../../../database/init-db');
    const db = getDatabase();

    try {
        // 🔒 BEYAZ ŞAPKALI: Check if user exists by email
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userInfo.email.toLowerCase());

        if (user) {
            // Update existing user with Google info
            db.prepare(`
                UPDATE users SET
                    googleId = ?,
                    avatar = ?,
                    emailVerified = ?,
                    lastLogin = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                userInfo.id,
                userInfo.picture || user.avatar,
                userInfo.verified_email ? 1 : user.emailVerified,
                user.id
            );

            console.log(`[Google OAuth] Existing user updated: ${user.email}`);
        } else {
            // Create new user
            const result = db.prepare(`
                INSERT INTO users (
                    email, name, googleId, avatar, emailVerified,
                    subscription, credits, status, role
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                userInfo.email.toLowerCase(),
                userInfo.name,
                userInfo.id,
                userInfo.picture,
                userInfo.verified_email ? 1 : 0,
                'free',
                100, // Initial credits
                'active',
                'USER'
            );

            user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

            console.log(`[Google OAuth] New user created: ${user.email}`);

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
        const { code, error, state } = req.query;

        // 🔒 SECURITY: Handle OAuth errors
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
        console.log('[Google OAuth] ✓ Tokens received');

        // Get user info from Google
        const userInfo = await getUserInfo(tokens.access_token);
        console.log('[Google OAuth] ✓ User info received:', userInfo.email);

        // 🔒 BEYAZ ŞAPKALI: Find or create user in database
        const user = await findOrCreateUser(userInfo, tokens);

        // 🔒 BEYAZ ŞAPKALI: Generate JWT token
        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role || 'USER',
                subscription: user.subscription || 'free',
                provider: 'lydian-vision'
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
                    provider, oauthAccessToken, oauthRefreshToken
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                user.id,
                jwtToken,
                sessionId,
                req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
                req.headers['user-agent'] || 'unknown',
                expiresAt.toISOString(),
                'lydian-vision',
                tokens.access_token,
                tokens.refresh_token || null
            );
        } finally {
            db.close();
        }

        console.log('[Google OAuth] ✓ Session created:', sessionId);

        // 🔒 SECURITY: Log OAuth login activity
        User.logActivity({
            userId: user.id,
            action: 'oauth_login',
            description: 'User logged in via Google OAuth',
            ipAddress: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: { provider: 'lydian-vision', emailVerified: userInfo.verified_email }
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

                    console.log(`[Google OAuth] Login notification sent to ${user.email}`);
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
        console.log(`[Google OAuth] ✓ Login successful for ${user.email}`);
        return res.redirect('/dashboard.html?login=success&provider=google');

    } catch (error) {
        console.error('[Google OAuth Callback] ❌ Error:', error.message);
        console.error(error.stack);
        return res.redirect('/auth.html?error=oauth_failed&provider=google');
    }
};
