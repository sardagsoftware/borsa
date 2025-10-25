// ============================================
// 👤 GET CURRENT USER
// Returns logged in user info from httpOnly cookie JWT
// 🔐 httpOnly Cookie Authentication
// ============================================

const { getAuthToken } = require('../../middleware/cookie-auth');
const { verifyToken } = require('../../middleware/api-auth');

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

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // 🔐 Get JWT token from httpOnly cookie or Authorization header
        const token = getAuthToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Not authenticated'
            });
        }

        // Verify JWT token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Invalid token'
            });
        }

        // Return user info from JWT payload
        return res.status(200).json({
            success: true,
            authenticated: true,
            user: {
                id: decoded.userId || decoded.id,
                email: decoded.email,
                role: decoded.role || 'USER',
                subscription: decoded.subscription || 'free',
                // Mock stats for now
                credits: 100,
                stats: {
                    chatMessages: 0,
                    imagesGenerated: 0,
                    voiceMinutes: 0
                }
            }
        });

    } catch (error) {
        console.error('[Auth Me] Error:', error.message);
        return res.status(401).json({
            success: false,
            authenticated: false,
            error: error.message || 'Authentication failed'
        });
    }
};
