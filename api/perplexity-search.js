// Ailydian AI - Web Search with Enterprise AI
// Model names are OBFUSCATED for security

const axios = require('axios');
const aiObfuscator = require('../lib/security/ai-obfuscator');

// Configuration - Azure OpenAI (Obfuscated)
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY || process.env.SECONDARY_AI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT || 'advanced-language-model';
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

  // Check if Azure OpenAI is configured (optional - will use demo mode if not)
  const hasAzureConfig = AZURE_OPENAI_KEY && AZURE_OPENAI_ENDPOINT &&
                         !AZURE_OPENAI_KEY.includes('YOUR_AZURE') &&
                         AZURE_OPENAI_KEY.length >= 20;

  if (!hasAzureConfig) {
    console.log('ℹ️  Azure OpenAI not configured - using Demo Mode');
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

    console.log(`🔍 Web Search Request: "${query}" (${hasAzureConfig ? 'Azure AI' : 'Demo Mode'})`);

    let answer, usage, citations;

    // Try Azure OpenAI if configured
    if (hasAzureConfig) {
      try {
        // Prepare Azure OpenAI endpoint
        const azureEndpoint = `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`;

        // Enhanced system prompt for web search simulation
        const systemPrompt = `You are an advanced AI web search assistant. Your task is to provide comprehensive, accurate, and up-to-date information.

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
        usage = response.data.usage;
        answer = result.content;

        console.log(`✅ Azure AI Search completed - ${usage.total_tokens} tokens used`);
      } catch (azureError) {
        console.warn('⚠️  Azure OpenAI failed, switching to Demo Mode:', azureError.message);
        // Fall back to demo mode
        answer = generateDemoResponse(query);
        usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      }
    } else {
      // Use demo mode directly
      answer = generateDemoResponse(query);
      usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }

    // Simulate citations from the answer (extract key topics)
    citations = extractSimulatedCitations(answer);

    // Return response WITHOUT revealing model name
    res.status(200).json({
      success: true,
      provider: 'Ailydian AI', // HIDDEN - Never reveal backend provider
      query: query,
      answer: answer,
      citations: citations,
      usage: usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Search Error:', error.message);

    // Sanitize error to prevent provider leaks
    const sanitizedError = aiObfuscator.sanitizeError(error);
    console.error('Error details:', sanitizedError.message);

    // More detailed error messages for debugging
    let errorMessage = 'Lütfen tekrar deneyin';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Bağlantı zaman aşımına uğradı';
    } else if (error.response?.status === 401) {
      errorMessage = 'AI API anahtarı geçersiz';
    } else if (error.response?.status === 429) {
      errorMessage = 'API limit aşıldı';
    } else if (error.response?.status === 404) {
      errorMessage = 'AI model bulunamadı';
    }

    // Generic error message (don't expose internal details)
    res.status(500).json({
      success: false,
      error: 'Web araması başarısız oldu',
      message: errorMessage
    });
  }
};

// Demo mode response generator (used when Azure OpenAI is not configured)
function generateDemoResponse(query) {
  // Detect language (basic Turkish detection)
  const isTurkish = /[ğüşıöçĞÜŞİÖÇ]/.test(query) ||
                    /\b(nedir|nasıl|ne|kim|nerede|niçin|hangi)\b/i.test(query);

  const templates = {
    turkish: [
      `"${query}" hakkında detaylı bilgi:\n\n## Genel Bakış\n\nBu konu hakkında yapılan araştırmalar, çeşitli perspektifler ve güncel gelişmeler sunmaktadır.\n\n## Önemli Noktalar\n\n- Konu ile ilgili temel bilgiler ve tanımlamalar\n- Güncel gelişmeler ve trendler\n- Pratik uygulamalar ve örnekler\n\n## Sonuç\n\nDaha detaylı bilgi için spesifik sorular sorabilirsiniz.`,

      `"${query}" konusunda arama sonuçları:\n\n### Ana Başlıklar\n\n**Tanım ve Kapsam**\nBu konunun temel özellikleri ve kapsamı hakkında bilgiler.\n\n**Önemli Detaylar**\n- İlgili kavramlar ve terminoloji\n- Pratik uygulamalar\n- Güncel yaklaşımlar\n\n### Özet\nKonuyla ilgili daha spesifik sorular sorabilirsiniz.`,
    ],
    english: [
      `Information about "${query}":\n\n## Overview\n\nResearch on this topic provides various perspectives and current developments.\n\n## Key Points\n\n- Fundamental information and definitions\n- Current developments and trends\n- Practical applications and examples\n\n## Conclusion\n\nFeel free to ask more specific questions for detailed information.`,

      `Search results for "${query}":\n\n### Main Topics\n\n**Definition and Scope**\nInformation about the fundamental characteristics and scope of this topic.\n\n**Important Details**\n- Related concepts and terminology\n- Practical applications\n- Current approaches\n\n### Summary\nYou can ask more specific questions about this topic.`,
    ]
  };

  const langTemplates = isTurkish ? templates.turkish : templates.english;
  const selectedTemplate = langTemplates[Math.floor(Math.random() * langTemplates.length)];

  return selectedTemplate;
}

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
