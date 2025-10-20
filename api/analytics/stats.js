// ============================================
// 📊 GET USER ANALYTICS
// Get user usage statistics and analytics
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { getUserAnalytics, getAllTimeStats } = require('../../lib/analytics/redis-analytics-store');

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

        // Get query parameters
        const { startDate, endDate, period = 'daily', allTime = 'false' } = req.query;

        let analytics;

        if (allTime === 'true') {
            // Get all-time stats
            analytics = await getAllTimeStats(session.userId);
        } else {
            // Get analytics for date range
            analytics = await getUserAnalytics(session.userId, {
                startDate,
                endDate,
                period
            });
        }

        return res.status(200).json({
            success: true,
            analytics: analytics
        });

    } catch (error) {
        console.error('[Get Analytics] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get analytics'
        });
    }
};
