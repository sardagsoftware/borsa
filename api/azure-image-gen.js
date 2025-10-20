// Ailydian AI - Image Generation with Azure DALL-E 3
// Model names are HIDDEN from frontend

const { AzureOpenAI } = require('openai');

// Azure OpenAI Configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || process.env.AZURE_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DALLE_DEPLOYMENT || 'dall-e-3';
const AZURE_API_VERSION = '2024-05-01-preview';

// Fallback to regular OpenAI if Azure not configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 50; // images per hour
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

// Generate image with Azure DALL-E 3
async function generateWithAzure(prompt, size = '1024x1024', quality = 'standard') {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_KEY) {
    throw new Error('Azure OpenAI not configured');
  }

  const client = new AzureOpenAI({
    apiKey: AZURE_OPENAI_KEY,
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiVersion: AZURE_API_VERSION
  });

  console.log(`🎨 Azure DALL-E 3 Request - Size: ${size}, Quality: ${quality}`);

  const response = await client.images.generate({
    model: AZURE_OPENAI_DEPLOYMENT,
    prompt: prompt,
    n: 1,
    size: size,
    quality: quality,
    style: 'vivid' // or 'natural'
  });

  return {
    provider: 'Azure OpenAI',
    url: response.data[0].url,
    revised_prompt: response.data[0].revised_prompt
  };
}

// Generate image with regular OpenAI (fallback)
async function generateWithOpenAI(prompt, size = '1024x1024', quality = 'standard') {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI not configured');
  }

  const OpenAI = require('openai');
const { handleCORS } = require('../middleware/cors-handler');
  const client = new OpenAI({
    apiKey: OPENAI_API_KEY
  });

  console.log(`🎨 OpenAI DALL-E 3 Request - Size: ${size}, Quality: ${quality}`);

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: size,
    quality: quality
  });

  return {
    provider: 'OpenAI',
    url: response.data[0].url,
    revised_prompt: response.data[0].revised_prompt
  };
}

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Çok fazla istek',
      message: 'Saatte maksimum 50 görsel oluşturabilirsiniz'
    });
  }

  try {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Görsel açıklaması gerekli'
      });
    }

    console.log(`🎨 Image Generation Request: "${prompt.substring(0, 50)}..."`);

    let result;

    // Try Azure first, fallback to OpenAI
    try {
      result = await generateWithAzure(prompt, size, quality);
    } catch (azureError) {
      console.log('⚠️ Azure failed, trying OpenAI fallback:', azureError.message);
      result = await generateWithOpenAI(prompt, size, quality);
    }

    console.log(`✅ Image generated successfully`);

    // Return response WITHOUT revealing model name
    res.status(200).json({
      success: true,
      provider: 'Ailydian AI', // HIDDEN - Never reveal "DALL-E" or "Azure"
      imageUrl: result.url,
      revisedPrompt: result.revised_prompt,
      size: size,
      quality: quality,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image Generation Error:', error.message);

    // Generic error message (don't expose internal details)
    res.status(500).json({
      success: false,
      error: 'Görsel oluşturma başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};
