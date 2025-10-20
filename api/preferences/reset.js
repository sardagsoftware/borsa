// ============================================
// 🔄 RESET USER PREFERENCES
// Reset preferences to defaults
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { resetPreferences } = require('../../lib/storage/redis-preferences-store');

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

        // Reset preferences
        const preferences = await resetPreferences(session.userId);

        return res.status(200).json({
            success: true,
            message: 'Preferences reset to defaults',
            preferences: preferences
        });

    } catch (error) {
        console.error('[Reset Preferences] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to reset preferences'
        });
    }
};
