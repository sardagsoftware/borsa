// ============================================
// 🔍 SEARCH CONVERSATIONS
// Search user's conversations by title
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { searchConversations } = require('../../lib/storage/redis-conversation-store');

module.exports = async (req, res) => {
    // CORS Headers
    const allowedOrigins = [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'https://ailydian-ultra-pro.vercel.app'
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

        // Get search query
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }

        // Search conversations
        const results = await searchConversations(session.userId, q.trim());

        return res.status(200).json({
            success: true,
            query: q.trim(),
            results: results,
            total: results.length
        });

    } catch (error) {
        console.error('[Search Conversations] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to search conversations'
        });
    }
};
