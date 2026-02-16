// ============================================
// 💬 CREATE CONVERSATION API
// Create new conversation for authenticated user
// ============================================

const { getSession, getUserById } = require('../../lib/auth/redis-session-store');
const { createConversation } = require('../../lib/storage/redis-conversation-store');
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

        // Get request data
        const { title, domain, language } = req.body;

        // Create conversation
        const conversation = await createConversation(session.userId, {
            title: title || 'New Conversation',
            domain: domain || 'general',
            language: language || 'tr-TR'
        });

        return res.status(201).json({
            success: true,
            conversation: conversation
        });

    } catch (error) {
        console.error('[Create Conversation] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to create conversation'
        });
    }
};
