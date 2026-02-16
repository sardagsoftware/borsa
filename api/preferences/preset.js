// ============================================
// 🎨 APPLY PREFERENCE PRESET
// Apply predefined preference preset (medical, legal, developer, general)
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { applyPreset, PRESETS } = require('../../lib/storage/redis-preferences-store');
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

        // Get preset name from request body
        const { preset } = req.body;

        if (!preset) {
            return res.status(400).json({
                success: false,
                error: 'Preset name required',
                availablePresets: Object.keys(PRESETS)
            });
        }

        if (!PRESETS[preset]) {
            return res.status(400).json({
                success: false,
                error: `Invalid preset: ${preset}`,
                availablePresets: Object.keys(PRESETS)
            });
        }

        // Apply preset
        const preferences = await applyPreset(session.userId, preset);

        return res.status(200).json({
            success: true,
            message: `Preset "${preset}" applied successfully`,
            preferences: preferences
        });

    } catch (error) {
        console.error('[Apply Preset] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to apply preset'
        });
    }
};
