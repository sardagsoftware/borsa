// ============================================
// 🗑️ DELETE FILE
// Delete file from Azure Blob and Redis
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { deleteFile, getFileMetadata } = require('../../lib/storage/azure-blob-file-store');
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

    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'DELETE') {
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

        // Get file ID from query
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'File ID required'
            });
        }

        // Get file to verify ownership
        const file = await getFileMetadata(id);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Verify ownership
        if (file.userId !== session.userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // Delete file
        await deleteFile(id, session.userId);

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('[Delete File] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete file'
        });
    }
};
