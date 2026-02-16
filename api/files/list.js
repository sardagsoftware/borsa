// ============================================
// 📋 LIST FILES
// Get all files for authenticated user
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { listUserFiles } = require('../../lib/storage/azure-blob-file-store');
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

        // Get pagination params
        const { limit = '20', offset = '0' } = req.query;

        // List files
        const result = await listUserFiles(session.userId, {
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('[List Files] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to list files'
        });
    }
};
