// ============================================
// 💾 UPDATE USER PREFERENCES
// Update user preferences (partial updates supported)
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { updatePreferences, validatePreferences } = require('../../lib/storage/redis-preferences-store');
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

    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
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

        // Get updates from request body
        const updates = req.body;

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No preferences provided'
            });
        }

        // Validate updates
        const validation = validatePreferences(updates);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid preferences',
                details: validation.errors
            });
        }

        // Update preferences
        const preferences = await updatePreferences(session.userId, updates);

        return res.status(200).json({
            success: true,
            preferences: preferences
        });

    } catch (error) {
        console.error('[Update Preferences] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
};
