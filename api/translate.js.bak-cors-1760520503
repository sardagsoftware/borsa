/**
 * AiLydian Ultra Pro - Translation API Service
 * Backend translation service using OpenAI GPT-4 Turbo (via .env)
 * Supports 9 languages with caching and rate limiting
 */

const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// Environment variables (will be loaded from .env)
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4';

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
    console.error('❌ Azure OpenAI credentials not found in .env file');
    console.error('Expected path:', envPath);
    console.error('Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT');
    process.exit(1);
}

console.log('✅ Azure OpenAI configured:', AZURE_OPENAI_ENDPOINT);
console.log('✅ Using deployment:', AZURE_OPENAI_DEPLOYMENT);

// Supported languages
const SUPPORTED_LANGUAGES = {
    'tr': 'Turkish',
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'es': 'Spanish',
    'ar': 'Arabic'
};

// Translation cache to reduce API calls
const translationCache = new Map();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;

/**
 * Main translation handler
 */
async function handleTranslate(req, res) {
    try {
        // CORS headers for browser requests - MUST BE FIRST
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400');

        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
        }

        // Only allow POST
        if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Method not allowed',
                message: 'Only POST requests are supported'
            }));
            return;
        }

        // Parse request body
        const { text, targetLang, sourceLang } = req.body;

        // Validate input
        if (!text || typeof text !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Invalid input',
                message: 'Text is required and must be a string'
            }));
            return;
        }

        if (!targetLang || !SUPPORTED_LANGUAGES[targetLang]) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Invalid target language',
                message: `Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
            }));
            return;
        }

        // Rate limiting check
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (isRateLimited(clientIP)) {
            res.statusCode = 429;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.'
            }));
            return;
        }

        // Check cache
        const cacheKey = `${text}:${targetLang}:${sourceLang || 'auto'}`;
        const cached = getFromCache(cacheKey);
        if (cached) {
            console.log('✅ Cache hit for translation');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                translatedText: cached,
                cached: true,
                targetLang,
                sourceLang: sourceLang || 'auto'
            }));
            return;
        }

        // Translate using OpenAI GPT-4 Turbo
        const translatedText = await translateWithOpenAI(text, targetLang, sourceLang);

        // Store in cache
        setInCache(cacheKey, translatedText);

        // Return response
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            translatedText,
            cached: false,
            targetLang,
            sourceLang: sourceLang || 'auto',
            timestamp: new Date().toISOString()
        }));

    } catch (error) {
        console.error('Translation error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'Translation failed',
            message: error.message || 'Internal server error'
        }));
    }
}

/**
 * Translate text using Azure OpenAI GPT-4
 */
async function translateWithOpenAI(text, targetLang, sourceLang = 'auto') {
    try {
        const prompt = `Translate the following text to ${SUPPORTED_LANGUAGES[targetLang]}. Return ONLY the translated text, nothing else:\n\n${text}`;

        // Azure OpenAI endpoint format
        const apiUrl = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_OPENAI_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional translator. Translate text accurately while preserving formatting, tone, and context. Return only the translated text without any explanations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // FALLBACK: If Azure fails (rate limit, content filter, etc), return original text
            if (response.status === 429 || response.status === 400) {
                console.warn(`⚠️ Azure translation failed (${response.status}), returning original text`);
                return text; // Return original text as fallback
            }

            throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.warn('⚠️ Invalid Azure response, returning original text');
            return text; // Return original text as fallback
        }

        const translatedText = data.choices[0].message.content.trim();
        console.log(`✅ Translated to ${targetLang}: ${text.substring(0, 50)}...`);

        return translatedText;

    } catch (error) {
        console.error('Azure OpenAI translation error:', error);
        // FALLBACK: Return original text on any error
        console.warn('⚠️ Translation error, returning original text');
        return text;
    }
}

/**
 * Cache management
 */
function getFromCache(key) {
    const cached = translationCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
        translationCache.delete(key);
        return null;
    }

    return cached.value;
}

function setInCache(key, value) {
    // Implement LRU eviction if cache is full
    if (translationCache.size >= CACHE_MAX_SIZE) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
    }

    translationCache.set(key, {
        value,
        timestamp: Date.now()
    });
}

/**
 * Rate limiting
 */
function isRateLimited(clientIP) {
    const now = Date.now();
    const clientRequests = rateLimit.get(clientIP) || [];

    // Remove old requests outside the window
    const recentRequests = clientRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    // Check if limit exceeded
    if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    // Add current request
    recentRequests.push(now);
    rateLimit.set(clientIP, recentRequests);

    return false;
}

/**
 * Health check endpoint
 */
async function handleHealth(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    res.statusCode = 200;
    res.end(JSON.stringify({
        status: 'healthy',
        service: 'AiLydian Translation API',
        version: '1.0.0',
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
        cacheSize: translationCache.size,
        timestamp: new Date().toISOString()
    }));
}

/**
 * Vercel serverless function export
 */
module.exports = async (req, res) => {
    // Route handling
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/api/translate' || pathname === '/translate') {
        return handleTranslate(req, res);
    } else if (pathname === '/api/translate/health' || pathname === '/translate/health') {
        return handleHealth(req, res);
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: 'Not found',
            message: 'Endpoint not found'
        }));
    }
};

// For local testing
if (require.main === module) {
    const http = require('http');
    const PORT = process.env.PORT || 3100;

    const server = http.createServer(async (req, res) => {
        // Parse body for POST requests
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    req.body = JSON.parse(body);
                } catch (e) {
                    req.body = {};
                }
                await module.exports(req, res);
            });
        } else {
            req.body = {};
            await module.exports(req, res);
        }
    });

    server.listen(PORT, () => {
        console.log(`🌍 Translation API server running on http://localhost:${PORT}`);
        console.log(`📍 Endpoint: POST http://localhost:${PORT}/api/translate`);
        console.log(`💚 Health check: GET http://localhost:${PORT}/api/translate/health`);
    });
}
