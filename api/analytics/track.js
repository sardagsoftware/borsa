// ============================================
// 📈 TRACK USAGE EVENT
// Track user activity for analytics
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { trackUsage, trackSystemEvent } = require('../../lib/analytics/redis-analytics-store');

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

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
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

        // Get event data from request body
        const event = req.body;

        if (!event || !event.type) {
            return res.status(400).json({
                success: false,
                error: 'Event type required'
            });
        }

        // Validate event type
        const validTypes = ['message', 'conversation', 'file_upload', 'search', 'login', 'logout'];
        if (!validTypes.includes(event.type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event type',
                validTypes: validTypes
            });
        }

        // Track usage
        const usageEvent = await trackUsage(session.userId, event);

        // Track system-wide event
        await trackSystemEvent(event);

        return res.status(201).json({
            success: true,
            event: usageEvent
        });

    } catch (error) {
        console.error('[Track Usage] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to track usage'
        });
    }
};
