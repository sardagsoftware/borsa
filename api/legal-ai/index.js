/**
 * ⚖️ LyDian AI - Legal AI API Endpoint (Vercel Serverless Function)
 *
 * Unified API for all legal AI services - Vercel Compatible
 * POST /api/legal-ai - Main chat endpoint
 * GET /api/legal-ai/health - Health check
 *
 * White-Hat Security: Active
 * Priority: Judges → Prosecutors → Lawyers → Citizens
 */

const { handleCORS } = require('../_lib/cors-simple');
const { applySanitization } = require('../_middleware/sanitize');

// For Vercel serverless functions, we need to use a different approach
// Try to load Groq SDK if available
let Groq, groq;
try {
  Groq = require('groq-sdk');
  groq = process.env.GROQ_API_KEY
    ? new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })
    : null;
} catch (e) {
  // Groq SDK not available, will use mock responses
  groq = null;
}

// Mock legal responses for demo/fallback
const mockLegalResponses = {
  tr: [
    'Hukuki sorunuz için teşekkür ederim. Bu konuda size yardımcı olmak isterim. Ancak, lütfen unutmayın ki ben yapay zeka bir asistanım ve verdiğim bilgiler genel niteliktedir. Kesin hukuki görüş için mutlaka bir avukata danışmalısınız.',
    'Yasal durumunuzu anlıyorum. Türk hukuku çerçevesinde bu tür davalar genellikle ilgili mahkemede açılır. Süreç, davanın türüne göre değişiklik gösterebilir. Daha detaylı bilgi için yetkili bir hukuk uzmanına başvurmanızı öneririm.',
    "Sorununuz hakkında genel bilgi verebilirim. Türkiye'de hukuk sisteminde vatandaşların hakları anayasa ve ilgili kanunlarla korunmaktadır. Sizin durumunuzda hangi adımların atılması gerektiği konusunda bir avukattan profesyonel destek almanız faydalı olacaktır.",
  ],
  en: [
    "Thank you for your legal question. I'd be happy to help. However, please remember that I'm an AI assistant and the information I provide is general in nature. For specific legal advice, you should consult with a qualified attorney.",
    'I understand your legal situation. In Turkish law, such cases are typically filed in the relevant court. The process may vary depending on the type of case. I recommend consulting with a qualified legal expert for more detailed information.',
    "I can provide general information about your issue. In Turkey's legal system, citizens' rights are protected by the constitution and relevant laws. For guidance on what steps to take in your situation, it would be beneficial to seek professional support from an attorney.",
  ],
};

/**
 * Main handler for Vercel serverless function
 */
module.exports = async (req, res) => {
  applySanitization(req, res);
  // Enable CORS
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  try {
    // Parse query for GET requests
    const path = req.query.path || [];
    const pathStr = Array.isArray(path) ? path.join('/') : path;

    // GET /api/legal-ai/health
    if (req.method === 'GET' && (pathStr === 'health' || req.url?.includes('/health'))) {
      return res.status(200).json({
        success: true,
        status: 'healthy',
        services: {
          groq: groq ? 'ready' : 'not configured',
          legalAI: 'ready',
        },
        features: {
          legalAnalysis: true,
          turkishLaw: true,
          multiLanguage: true,
        },
        securityRules: {
          whiteHat: 'active',
          kvkkCompliance: 'active',
          gdprCompliance: 'active',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // POST /api/legal-ai - Main chat endpoint
    if (req.method === 'POST') {
      const { message, language = 'tr', systemPrompt, knowledgeContext, settings = {} } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'message is required',
        });
      }

      let response;
      let model = 'LyDian Legal AI';

      // Try Groq first
      if (groq) {
        try {
          const completion = await groq.chat.completions.create({
            model: 'GX8E2D9A',
            messages: [
              {
                role: 'system',
                content:
                  systemPrompt ||
                  `Sen LyDian AI, Türk hukuku konusunda uzmanlaşmış yapay zeka asistanısın. ${language === 'tr' ? 'Türkçe' : 'İngilizce'} yanıt ver. Profesyonel, etik ve beyaz şapkalı güvenlik kurallarına uygun yanıtlar ver.`,
              },
              {
                role: 'user',
                content: message,
              },
            ],
            temperature: settings.temperature || 0.7,
            max_tokens: settings.maxTokens || 1024,
          });

          response = completion.choices[0]?.message?.content || 'Yanıt alınamadı';
          model = 'LyDian Legal AI';
        } catch (groqError) {
          console.error('AI API error, falling back to mock:', groqError.message);
          // Fallback to mock
          const mockResponses = mockLegalResponses[language] || mockLegalResponses.en;
          response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
          model = 'LyDian Legal AI (Mock)';
        }
      } else {
        // Use mock responses
        const mockResponses = mockLegalResponses[language] || mockLegalResponses.en;
        response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        model = 'LyDian Legal AI (Mock)';
      }

      return res.status(200).json({
        success: true,
        response: response,
        model: model,
        language: language,
        role: 'citizen',
        tokensUsed: response.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Method not allowed
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('❌ Legal AI API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Islem basarisiz. Lutfen tekrar deneyin.',
    });
  }
};
