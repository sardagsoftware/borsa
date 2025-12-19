/**
 * TOKEN REFRESH ENDPOINT
 * Refreshes expired access tokens using refresh token
 */

const { Client } = require('pg');
const { generateAccessToken, verifyRefreshToken } = require('./jwt-middleware');

let dbClient = null;

async function getDbClient() {
    if (!dbClient) {
        dbClient = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        await dbClient.connect();
    }
    return dbClient;
}

async function refreshAccessToken(refreshToken) {
    const db = await getDbClient();
    const decoded = verifyRefreshToken(refreshToken);

    const sessionResult = await db.query(
        'SELECT id, user_id, expires_at, revoked FROM user_sessions WHERE refresh_token = $1 AND user_id = $2',
        [refreshToken, decoded.userId]
    );

    if (sessionResult.rows.length === 0) throw new Error('Invalid refresh token');
    
    const session = sessionResult.rows[0];
    if (session.revoked) throw new Error('Refresh token has been revoked');
    if (new Date(session.expires_at) < new Date()) throw new Error('Refresh token expired');

    const userResult = await db.query(
        'SELECT id, email, role, full_name, status FROM users WHERE id = $1',
        [decoded.userId]
    );

    if (userResult.rows.length === 0) throw new Error('User not found');
    
    const user = userResult.rows[0];
    if (user.status !== 'active') throw new Error('Account is not active');

    const accessToken = generateAccessToken(user.id, user.email, user.role || 'patient', { fullName: user.full_name });

    await db.query('UPDATE user_sessions SET last_used_at = NOW() WHERE id = $1', [session.id]);

    return {
        accessToken,
        expiresIn: '15m',
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role || 'patient' }
    };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        let refreshToken = req.body.refreshToken;
        if (!refreshToken && req.cookies && req.cookies.refresh_token) {
            refreshToken = req.cookies.refresh_token;
        }

        if (!refreshToken) {
            return res.status(400).json({ success: false, error: 'Refresh token is required', code: 'NO_REFRESH_TOKEN' });
        }

        const result = await refreshAccessToken(refreshToken);

        return res.status(200).json({
            success: true,
            data: { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user },
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        console.error('Token refresh error:', error);

        if (error.message.includes('expired')) {
            return res.status(401).json({ success: false, error: 'Refresh token expired', code: 'REFRESH_TOKEN_EXPIRED', hint: 'Please login again' });
        }

        if (error.message.includes('revoked')) {
            return res.status(401).json({ success: false, error: 'Refresh token has been revoked', code: 'REFRESH_TOKEN_REVOKED', hint: 'Please login again' });
        }

        if (error.message.includes('Invalid')) {
            return res.status(401).json({ success: false, error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
        }

        return res.status(500).json({ success: false, error: 'Token refresh failed', code: 'SERVER_ERROR', details: error.message });
    }
}
