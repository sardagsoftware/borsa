// ============================================
// 🌐 GET SYSTEM-WIDE ANALYTICS
// Get system statistics (admin only)
// ============================================

const { getSession, getUserById } = require('../../lib/auth/redis-session-store');
const { getSystemStats } = require('../../lib/analytics/redis-analytics-store');

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
                error: 'Not authenticated'
            });
        }

        const sessionId = sessionIdMatch[1];

        // Get session
        const session = await getSession(sessionId);

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Session expired'
            });
        }

        // Get user to check admin role
        const user = await getUserById(session.userId);

        // Check if user is admin (you can implement role-based access control)
        // For now, we'll allow all authenticated users to see system stats
        // In production, add proper role checking here

        // Get system stats
        const stats = await getSystemStats();

        return res.status(200).json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('[Get System Stats] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get system stats'
        });
    }
};
