// ============================================
// ✉️ ADD MESSAGE TO CONVERSATION
// Post new message to conversation
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { getConversation, addMessage } = require('../../lib/storage/redis-conversation-store');

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
        const { conversationId, role, content, metadata, fileReferences } = req.body;

        if (!conversationId || !role || !content) {
            return res.status(400).json({
                success: false,
                error: 'conversationId, role, and content are required'
            });
        }

        // Validate role
        if (role !== 'user' && role !== 'assistant') {
            return res.status(400).json({
                success: false,
                error: 'role must be "user" or "assistant"'
            });
        }

        // Get conversation to verify ownership
        const conversation = await getConversation(conversationId);

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

        // Add message
        const message = await addMessage(conversationId, {
            userId: session.userId,
            role: role,
            content: content,
            metadata: metadata || {},
            fileReferences: fileReferences || []
        });

        return res.status(201).json({
            success: true,
            message: message
        });

    } catch (error) {
        console.error('[Add Message] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to add message'
        });
    }
};
