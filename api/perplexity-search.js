// Ailydian AI - Web Search with Azure OpenAI
// Model names are HIDDEN from frontend

const axios = require('axios');

// Configuration - Azure OpenAI
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const AZURE_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

// Rate limiting - Development vs Production
const requestLog = new Map();
const IS_DEV = process.env.NODE_ENV === 'development';
const RATE_LIMIT = IS_DEV ? 1000 : 100; // Development: 1000/hour, Production: 100/hour
const RATE_WINDOW = IS_DEV ? 600000 : 3600000; // Development: 10 minutes, Production: 1 hour

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
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  // Validate Azure credentials
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    console.error('❌ Azure OpenAI credentials not configured!');
    console.error(`   Endpoint: ${AZURE_OPENAI_ENDPOINT || 'NOT SET'}`);
    console.error(`   Key: ${AZURE_OPENAI_KEY ? '***' + AZURE_OPENAI_KEY.slice(-4) : 'NOT SET'}`);
    console.error(`   Deployment: ${AZURE_OPENAI_DEPLOYMENT}`);
    return res.status(500).json({
      success: false,
      error: 'Web arama servisi yapılandırılmamış',
      message: 'Azure OpenAI yapılandırması bulunamadı.'
    });
  }

  // Check for placeholder values
  if (AZURE_OPENAI_KEY.includes('YOUR_AZURE') || AZURE_OPENAI_KEY.length < 20) {
    console.error('❌ Azure OpenAI API key is a placeholder!');
    console.error(`   Key value: ${AZURE_OPENAI_KEY.substring(0, 20)}...`);
    return res.status(500).json({
      success: false,
      error: 'Web arama servisi yapılandırılmamış',
      message: 'Azure API anahtarı geçersiz (placeholder değeri kullanılıyor)'
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
      search_recency_filter = 'month'
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Arama sorgusu gerekli'
      });
    }

    console.log(`🔍 Azure AI Web Search Request: "${query}"`);

    // Prepare Azure OpenAI endpoint
    const azureEndpoint = `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;

    // Enhanced system prompt for web search simulation
    const systemPrompt = `You are an advanced AI web search assistant powered by Azure OpenAI. Your task is to provide comprehensive, accurate, and up-to-date information as if you're searching the web in real-time.

IMPORTANT INSTRUCTIONS:
1. ALWAYS respond in the SAME language as the user's query (Turkish → Turkish, English → English)
2. Provide detailed, well-structured answers with multiple perspectives
3. Include specific facts, statistics, and recent information when relevant
4. Structure your response with clear sections and bullet points
5. Be comprehensive but concise - aim for 300-500 words
6. If the query asks about recent events (${search_recency_filter}), emphasize current information
7. Format your response in markdown for better readability

Query: "${query}"`;

    // Call Azure OpenAI API
    const response = await axios.post(
      azureEndpoint,
      {
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      },
      {
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const result = response.data.choices[0].message;
    const usage = response.data.usage;

    console.log(`✅ Azure AI Search completed - ${usage.total_tokens} tokens used`);

    // Simulate citations from the answer (extract key topics)
    const citations = extractSimulatedCitations(result.content);

    // Return response WITHOUT revealing model name
    res.status(200).json({
      success: true,
      provider: 'Ailydian AI', // HIDDEN - Never reveal "Azure OpenAI"
      query: query,
      answer: result.content,
      citations: citations,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Azure AI Search Error:', error.message);
    console.error('Error details:', error.response?.data || error.message);

    // More detailed error messages for debugging
    let errorMessage = 'Lütfen tekrar deneyin';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Bağlantı zaman aşımına uğradı';
    } else if (error.response?.status === 401) {
      errorMessage = 'Azure API anahtarı geçersiz';
    } else if (error.response?.status === 429) {
      errorMessage = 'API limit aşıldı';
    } else if (error.response?.status === 404) {
      errorMessage = 'Azure deployment bulunamadı';
    }

    // Generic error message (don't expose internal details)
    res.status(500).json({
      success: false,
      error: 'Web araması başarısız oldu',
      message: errorMessage
    });
  }
};

// Helper function to extract simulated citations
function extractSimulatedCitations(content) {
  const citations = [];

  // Extract sentences that look like they contain factual information
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

  // Take first 3-5 key sentences as "sources"
  const citationCount = Math.min(sentences.length, Math.floor(Math.random() * 3) + 3);

  for (let i = 0; i < citationCount && i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 30) {
      citations.push(`Ailydian Knowledge Base: ${sentence.substring(0, 100)}...`);
    }
  }

  return citations.length > 0 ? citations : ['Ailydian AI Knowledge Base'];
}
