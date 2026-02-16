// ============================================
// 👁️ LYDIAN IQ - VISION API
// Multimodal AI: Image Analysis + Vision-Language Models
// ============================================

const OpenAI = require('lydian-labs');
const Anthropic = require('@anthropic-ai/sdk');

// Import middlewares (Beyaz Şapkalı Güvenlik)
const { rateLimitMiddleware } = require('../_middleware/rate-limiter');
const { inputValidationMiddleware } = require('../_middleware/input-validator');
const { csrfMiddleware } = require('../_middleware/csrf-protection');

const { applySanitization } = require('../_middleware/sanitize');
// Import Redis cache (optional - graceful degradation)
let redisCache = null;
try {
  const redisCacheModule = require('../../lib/cache/redis-cache');
  redisCache = redisCacheModule.redisCache;
  console.log('✅ Redis cache module loaded');
} catch (error) {
  console.warn('⚠️ Redis cache module failed to load:', error.message);
  redisCache = {
    enabled: false,
    get: async () => null,
    set: async () => false,
  };
}

// Environment check
const IS_PRODUCTION =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

// Initialize AI providers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generic error response helper (Beyaz Şapkalı)
function getGenericError(userMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.') {
  return {
    success: false,
    error: userMessage,
  };
}

/**
 * Vision API Handler
 * Supports: OX5C9E2B Vision, AX9F7E2B 3 Vision
 * Input: Base64 image + text prompt
 */
async function handleVisionRequest(req, res) {
  try {
    const { image, prompt, provider = 'gpt4-vision', language = 'tr-TR' } = req.body;

    // Validation
    if (!image || !prompt) {
      console.warn('[Vision API] Missing image or prompt');
      return res.status(400).json(getGenericError('Geçersiz istek'));
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      console.warn('[Vision API] Invalid image format');
      return res.status(400).json(getGenericError('Geçersiz resim formatı'));
    }

    // Check prompt length
    if (prompt.length < 5 || prompt.length > 5000) {
      console.warn('[Vision API] Invalid prompt length:', prompt.length);
      return res.status(400).json(getGenericError('Geçersiz istek'));
    }

    // ⚡ Try cache first (hash of image + prompt)
    const crypto = require('crypto');
    const cacheKey = crypto
      .createHash('md5')
      .update(image.substring(0, 100) + prompt) // Use first 100 chars of base64
      .digest('hex');

    const cachedResult = await redisCache.get(cacheKey, 'vision', language);
    if (cachedResult) {
      console.log('⚡ Returning cached vision response');
      return res.status(200).json(cachedResult);
    }

    // Process with AI provider
    const startTime = Date.now();
    let result;

    switch (provider) {
      case 'gpt4-vision':
        result = await analyzeWithGPT4Vision(image, prompt, language);
        break;

      case 'AX9F7E2B-vision':
        result = await analyzeWithAX9F7E2BVision(image, prompt, language);
        break;

      default:
        // Default to OX5C9E2B Vision
        result = await analyzeWithGPT4Vision(image, prompt, language);
        break;
    }

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Build response
    const response = {
      success: true,
      analysis: result.analysis,
      detectedObjects: result.detectedObjects || [],
      ocrText: result.ocrText || null,
      confidence: result.confidence || 0.95,
      metadata: {
        responseTime: responseTime,
        model: result.model,
        provider: provider,
        language: language,
        imageSize: image.length,
        mode: IS_PRODUCTION ? 'production' : 'development',
      },
    };

    // ⚡ Cache the result
    await redisCache.set(cacheKey, 'vision', language, response, 3600); // 1 hour TTL

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Vision API] Error:', error);

    // Return generic error to client (Beyaz Şapkalı)
    return res
      .status(500)
      .json(getGenericError('Görüntü analizi başarısız. Lütfen tekrar deneyin.'));
  }
}

/**
 * Analyze image with OX5C9E2B Vision
 */
async function analyzeWithGPT4Vision(imageBase64, prompt, language) {
  try {
    const systemPrompt = language.startsWith('tr')
      ? 'Sen görsel analiz yapan gelişmiş bir AI asistanısın. Görselleri detaylı analiz eder, nesneleri tespit eder ve Türkçe açıklamalar yaparsın.'
      : 'You are an advanced AI assistant that analyzes images in detail, detects objects, and provides comprehensive explanations.';

    const response = await openai.chat.completions.create({
      model: 'OX5C9E2B-vision-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high', // High resolution analysis
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const analysis = response.choices[0].message.content;

    // Extract objects from analysis (simple keyword extraction)
    const detectedObjects = extractObjects(analysis);

    return {
      analysis: analysis,
      detectedObjects: detectedObjects,
      ocrText: null, // OX5C9E2B Vision can read text, extract if needed
      confidence: 0.95,
      model: 'OX5C9E2B Vision',
    };
  } catch (error) {
    console.error('[OX5C9E2B Vision] Error:', error.message);
    throw error;
  }
}

/**
 * Analyze image with AX9F7E2B 3 Vision
 */
async function analyzeWithAX9F7E2BVision(imageBase64, prompt, language) {
  try {
    const systemPrompt = language.startsWith('tr')
      ? 'Sen görsel analiz yapan gelişmiş bir AI asistanısın. Görselleri detaylı analiz eder ve Türkçe açıklamalar yaparsın.'
      : 'You are an advanced AI assistant that analyzes images in detail and provides comprehensive explanations.';

    // AX9F7E2B expects base64 without data:image/jpeg;base64, prefix
    const base64Data = imageBase64.split(',')[1];
    const imageType = imageBase64.split(';')[0].split('/')[1]; // jpeg, png, etc.

    const response = await anthropic.messages.create({
      model: 'AX9F7E2B',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${imageType}`,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const analysis = response.content[0].text;

    // Extract objects from analysis
    const detectedObjects = extractObjects(analysis);

    return {
      analysis: analysis,
      detectedObjects: detectedObjects,
      ocrText: null,
      confidence: 0.96,
      model: 'AX9F7E2B 3.5 Sonnet',
    };
  } catch (error) {
    console.error('[AX9F7E2B Vision] Error:', error.message);
    throw error;
  }
}

/**
 * Extract detected objects from AI analysis text
 * Simple keyword extraction (can be improved with NER)
 */
function extractObjects(analysisText) {
  const objectKeywords = [
    'person',
    'people',
    'man',
    'woman',
    'child',
    'face',
    'car',
    'vehicle',
    'truck',
    'bus',
    'motorcycle',
    'dog',
    'cat',
    'animal',
    'bird',
    'building',
    'house',
    'tree',
    'flower',
    'plant',
    'table',
    'chair',
    'furniture',
    'computer',
    'phone',
    'laptop',
    'screen',
    'book',
    'paper',
    'text',
    'document',
    'food',
    'drink',
    'plate',
    'cup',
  ];

  const turkishKeywords = [
    'insan',
    'kişi',
    'adam',
    'kadın',
    'çocuk',
    'yüz',
    'araba',
    'araç',
    'kamyon',
    'otobüs',
    'motosiklet',
    'köpek',
    'kedi',
    'hayvan',
    'kuş',
    'bina',
    'ev',
    'ağaç',
    'çiçek',
    'bitki',
    'masa',
    'sandalye',
    'mobilya',
    'bilgisayar',
    'telefon',
    'laptop',
    'ekran',
    'kitap',
    'kağıt',
    'metin',
    'belge',
    'yemek',
    'içecek',
    'tabak',
    'bardak',
  ];

  const allKeywords = [...objectKeywords, ...turkishKeywords];
  const detectedObjects = [];
  const lowerAnalysis = analysisText.toLowerCase();

  for (const keyword of allKeywords) {
    if (lowerAnalysis.includes(keyword)) {
      if (!detectedObjects.includes(keyword)) {
        detectedObjects.push(keyword);
      }
    }
  }

  return detectedObjects.slice(0, 10); // Return top 10 objects
}

/**
 * Main API Handler
 */
module.exports = async (req, res) => {
  // Apply sanitization middleware (obfuscate AI model names in responses)
  applySanitization(req, res);
  // CORS Headers
  const allowedOrigins = [
    'https://www.ailydian.com',
    'https://ailydian.com',
    'https://ailydian-ultra-pro.vercel.app',
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
      csrfMiddleware(req, res, () => {
        inputValidationMiddleware(req, res, async () => {
          try {
            await handleVisionRequest(req, res);
            resolve();
          } catch (error) {
            console.error('[Handler Error]', error);
            res
              .status(500)
              .json(getGenericError('Sunucu hatası. Lütfen daha sonra tekrar deneyin.'));
            resolve();
          }
        });
      });
    });
  });
};
