// ============================================
// 🎨 IMAGE GENERATION API
// DALL-E 3 & Stable Diffusion Integration
// ============================================

// Import middlewares (Beyaz Şapkalı Güvenlik)
const { rateLimitMiddleware } = require('../_middleware/rate-limiter');
const { csrfMiddleware } = require('../_middleware/csrf-protection');

// Environment check
const IS_PRODUCTION =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Generic error response helper (Beyaz Şapkalı)
function getGenericError(userMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.') {
  return {
    success: false,
    error: userMessage,
  };
}

/**
 * Generate image using DALL-E 3
 */
async function generateWithDALLE3(
  prompt,
  size = '1024x1024',
  quality = 'standard',
  style = 'vivid'
) {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: style,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`DALL-E 3 error: ${response.status}`);
    }

    const data = await response.json();

    return {
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
      model: 'lydian-creative',
      size: size,
      quality: quality,
      style: style,
    };
  } catch (error) {
    console.error('[DALL-E 3] Error:', error.message);
    throw error;
  }
}

/**
 * Main request handler
 */
async function handleImageGenerationRequest(req, res) {
  try {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      provider = 'dalle3',
      language = 'tr-TR',
    } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      console.warn('[Image Gen] Invalid prompt');
      return res.status(400).json(getGenericError('Geçersiz istek'));
    }

    if (prompt.length > 4000) {
      console.warn('[Image Gen] Prompt too long');
      return res.status(400).json(getGenericError('Açıklama çok uzun'));
    }

    // Validate size
    const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return res.status(400).json(getGenericError('Geçersiz görsel boyutu'));
    }

    // Check if OpenAI is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY.length < 10) {
      return res.status(503).json({
        success: false,
        error: language.startsWith('tr')
          ? 'Görsel oluşturma servisi şu anda kullanılamıyor'
          : 'Image generation service currently unavailable',
        configured: false,
      });
    }

    // Generate image
    console.log('[Image Gen] Generating image...');
    const startTime = Date.now();

    const result = await generateWithDALLE3(prompt, size, quality, style);

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return res.status(200).json({
      success: true,
      imageUrl: result.url,
      revisedPrompt: result.revisedPrompt,
      originalPrompt: prompt,
      metadata: {
        responseTime: responseTime,
        model: result.model,
        provider: provider,
        size: result.size,
        quality: result.quality,
        style: result.style,
        language: language,
      },
    });
  } catch (error) {
    console.error('[Image Gen] Error:', error.message);
    const lang = (req.body && req.body.language) || 'tr-TR';

    if (error.message.includes('safety') || error.message.includes('policy')) {
      const message = lang.startsWith('tr')
        ? 'Bu içerik için görsel oluşturulamıyor'
        : 'Cannot generate image for this content';

      return res.status(400).json({
        success: false,
        error: message,
        reason: 'content_policy',
      });
    }

    return res.status(500).json(getGenericError('Görsel oluşturma başarısız'));
  }
}

/**
 * Main API Handler
 */
module.exports = async (req, res) => {
  // CORS Headers
  const allowedOrigins = [
    'https://www.ailydian.com',
    'https://ailydian.com',
    'https://ailydian-ultra-pro.vercel.app',
    'http://localhost:3000',
    'http://localhost:3100',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-csrf-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json(getGenericError('Method not allowed'));
  }

  // 🔒 Apply security middlewares
  return new Promise(resolve => {
    rateLimitMiddleware(req, res, () => {
      csrfMiddleware(req, res, async () => {
        try {
          await handleImageGenerationRequest(req, res);
          resolve();
        } catch (error) {
          console.error('[Handler Error]', error);
          res.status(500).json(getGenericError('Sunucu hatası'));
          resolve();
        }
      });
    });
  });
};
