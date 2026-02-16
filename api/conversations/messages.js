// ============================================
// 📨 GET CONVERSATION MESSAGES
// Get all messages in a conversation
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { getConversation, getMessages } = require('../../lib/storage/redis-conversation-store');
const { applySanitization } = require('../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
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

        // Get conversation ID from query
        const { id, limit = '50', offset = '0' } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Conversation ID required'
            });
        }

        // Get conversation to verify ownership
        const conversation = await getConversation(id);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }

        // Verify ownership
        if (conversation.userId !== session.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Get messages
        const result = await getMessages(id, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return res.status(200).json({
            success: true,
            conversationId: id,
            ...result
        });

    } catch (error) {
        console.error('[Get Messages] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to get messages'
        });
    }
};
