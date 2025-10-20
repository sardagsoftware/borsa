// ============================================
// 👤 GET CURRENT USER
// Returns logged in user info from Redis session
// ============================================

const { getSession, getUserById } = require('../../lib/auth/redis-session-store');

module.exports = async (req, res) => {
    // CORS Headers
    const allowedOrigins = [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'https://ailydian-ultra-pro.vercel.app',
        'http://localhost:3000',
        'http://localhost:3100'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Get session ID from cookie
        const cookies = req.headers.cookie || '';
        const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);

        if (!sessionIdMatch) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Not authenticated'
            });
        }

        const sessionId = sessionIdMatch[1];

        // Get session from Redis
        const session = await getSession(sessionId);

        if (!session) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Session expired'
            });
        }

        // Get user from Redis
        const user = await getUserById(session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                authenticated: false,
                error: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                provider: user.provider,
                createdAt: user.createdAt
            },
            session: {
                sessionId: sessionId,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt
            }
        });

    } catch (error) {
        console.error('[Auth Me] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get user info'
        });
    }
};
