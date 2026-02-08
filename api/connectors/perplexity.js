/**
 * 🔍 Perplexity Web Search Connector
 * Real-time web search with AI reasoning
 * Version: 1.0.0 - Sardag Edition
 */

const { getCorsOrigin } = require('../_middleware/cors');
const PERPLEXITY_CONFIG = {
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar', // Web search enabled model
    timeout: 30000 // 30 seconds
};

/**
 * Execute web search with Perplexity
 */
async function searchWeb(query, options = {}) {
    if (!PERPLEXITY_CONFIG.apiKey) {
        throw new Error('Perplexity API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PERPLEXITY_CONFIG.timeout);

    try {
        const requestBody = {
            model: PERPLEXITY_CONFIG.model,
            messages: [
                {
                    role: 'system',
                    content: 'Sen gerçek zamanlı web araması yapabilen bir AI asistanısın. Güncel bilgileri web\'den çekerek kullanıcıya sağlıyorsun. Cevaplarını Türkçe ver.'
                },
                {
                    role: 'user',
                    content: query
                }
            ],
            max_tokens: options.maxTokens || 2048,
            temperature: options.temperature || 0.2,
            top_p: options.topP || 0.9,
            search_domain_filter: options.domains || [], // Optional: filter by domains
            return_images: options.includeImages || false,
            return_related_questions: options.includeRelated || true,
            search_recency_filter: options.recency || 'month' // day, week, month, year
        };

        const response = await fetch(PERPLEXITY_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PERPLEXITY_CONFIG.apiKey}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Extract answer and citations
        const answer = data.choices?.[0]?.message?.content || '';
        const citations = data.citations || [];
        const relatedQuestions = data.related_questions || [];
        const images = data.images || [];

        return {
            success: true,
            answer,
            citations,
            relatedQuestions,
            images,
            metadata: {
                model: data.model,
                searchTime: data.usage?.completion_time || 0,
                tokensUsed: data.usage?.total_tokens || 0
            }
        };

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Web arama zaman aşımına uğradı');
        }
        throw error;
    }
}

/**
 * API Handler for Vercel
 */
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        const { query, options = {} } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Query parametresi gerekli (string)'
            });
        }

        const result = await searchWeb(query, options);

        res.status(200).json({
            success: true,
            connector: 'perplexity',
            timestamp: new Date().toISOString(),
            ...result
        });

    } catch (error) {
        console.error('Perplexity search error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Web arama başarısız oldu',
            timestamp: new Date().toISOString()
        });
    }
};

// For local testing
if (require.main === module) {
    (async () => {
        try {
            const result = await searchWeb('Türkiye\'nin başkenti nerede?');
            console.log('✅ Test successful:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    })();
}
