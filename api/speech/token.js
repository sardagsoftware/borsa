// ============================================
// 🎙️ AZURE SPEECH TOKEN API
// Generate temporary Azure Speech tokens for frontend
// ============================================

// Import middlewares
const { rateLimitMiddleware } = require('../_middleware/rate-limiter');
const { applySanitization } = require('../_middleware/sanitize');

// Azure Speech Configuration
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'westeurope';

/**
 * Generate Azure Speech token for frontend use
 * Token expires in 10 minutes
 */
async function generateSpeechToken() {
    try {
        if (!AZURE_SPEECH_KEY || AZURE_SPEECH_KEY.length < 10) {
            throw new Error('Azure Speech not configured');
        }

        const endpoint = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                'Content-Length': '0'
            }
        });

        if (!response.ok) {
            throw new Error(`Token generation failed: ${response.status}`);
        }

        const token = await response.text();

        return {
            token: token,
            region: AZURE_SPEECH_REGION,
            expiresIn: 600 // 10 minutes
        };

    } catch (error) {
        console.error('[Speech Token] Error:', error.message);
        throw error;
    }
}

/**
 * Main API Handler
 */
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

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    // Apply rate limiting
    return new Promise((resolve) => {
        rateLimitMiddleware(req, res, async () => {
            try {
                // Check if Azure Speech is configured
                if (!AZURE_SPEECH_KEY || AZURE_SPEECH_KEY.length < 10) {
                    return res.status(200).json({
                        success: true,
                        mode: 'browser',
                        message: 'Using browser Web Speech API (Azure Speech not configured)'
                    });
                }

                // Generate token
                const tokenData = await generateSpeechToken();

                res.status(200).json({
                    success: true,
                    mode: 'azure',
                    ...tokenData
                });

                resolve();

            } catch (error) {
                console.error('[Speech Token API] Error:', error.message);

                // Fallback to browser mode
                res.status(200).json({
                    success: true,
                    mode: 'browser',
                    message: 'Using browser Web Speech API (Azure token generation failed)',
                    fallback: true
                });

                resolve();
            }
        });
    });
};
