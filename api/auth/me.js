// ============================================
// 👤 GET CURRENT USER
// Returns logged in user info from httpOnly cookie JWT
// 🔐 httpOnly Cookie Authentication
// ============================================

const jwt = require('jsonwebtoken');

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
        // 🔐 Get JWT token from httpOnly cookie
        let token = null;

        if (req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').map(c => c.trim());
            const authCookie = cookies.find(c => c.startsWith('auth_token='));
            if (authCookie) {
                token = authCookie.split('=')[1];
            }
        }

        // Fallback to Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                error: 'Not authenticated'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', {
            issuer: 'LyDian-Platform',
            audience: 'LyDian-API'
        });

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
