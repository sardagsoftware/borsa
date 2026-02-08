// Ailydian AI - Web Search with Perplexity API
// Model names are HIDDEN from frontend

const axios = require('axios');
const { getCorsOrigin } = require('./_middleware/cors');

// Configuration
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions';

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 100; // requests per hour
const RATE_WINDOW = 3600000; // 1 hour

function checkRateLimit(userId = 'anonymous') {
  const now = Date.now();
  const userRequests = requestLog.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  requestLog.set(userId, recentRequests);
  return true;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Validate API key
  if (!PERPLEXITY_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Web arama servisi yapılandırılmamış'
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Çok fazla istek',
      message: 'Lütfen biraz bekleyin'
    });
  }

  try {
    const {
      query,
      search_domain_filter,
      search_recency_filter,
      return_images = false,
      return_related_questions = false
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Arama sorgusu gerekli'
      });
    }

    console.log(`🔍 Web Search Request: "${query}"`);

    // Call Perplexity API
    const response = await axios.post(
      PERPLEXITY_ENDPOINT,
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an AI search assistant. Provide accurate, concise answers based on current web information. ALWAYS respond in the SAME language as the user\'s query. If query is in Turkish, respond in Turkish. If in English, respond in English.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        search_domain_filter: search_domain_filter,
        return_images: return_images,
        return_related_questions: return_related_questions,
        search_recency_filter: search_recency_filter || 'month'
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const result = response.data.choices[0].message;
    const citations = response.data.citations || [];
    const images = response.data.images || [];
    const related_questions = response.data.related_questions || [];

    console.log(`✅ Search completed - ${citations.length} citations found`);

    // Return response WITHOUT revealing model name
    res.status(200).json({
      success: true,
      provider: 'Ailydian AI', // HIDDEN - Never reveal "Perplexity"
      query: query,
      answer: result.content,
      citations: citations,
      images: return_images ? images : undefined,
      related_questions: return_related_questions ? related_questions : undefined,
      usage: response.data.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Perplexity Search Error:', error.message);

    // Generic error message (don't expose internal details)
    res.status(500).json({
      success: false,
      error: 'Web araması başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};
