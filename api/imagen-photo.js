// LyDian Image Generation - Azure DALL-E 3 (Primary) + Google Imagen 3 (Fallback)
// Multi-Provider with Hidden AI

const { GoogleAuth } = require('google-auth-library');
const OpenAI = require('lydian-labs');
const { getCorsOrigin } = require('_middleware/cors');

// ==========================================
// AZURE DALL-E 3 CONFIGURATION (PRIMARY)
// ==========================================
const AZURE_DALLE = {
  enabled: () => !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY),
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deploymentName: process.env.AZURE_OPENAI_DALLE_DEPLOYMENT_NAME || 'dall-e-3',
  apiVersion: '2024-02-01'
};

// ==========================================
// GOOGLE IMAGEN 3 CONFIGURATION (FALLBACK)
// ==========================================
const VERTEX_CONFIG = {
  enabled: () => !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: 'us-central1',
  model: 'imagen-3.0-generate-001',
  endpoint: 'https://us-central1-aiplatform.googleapis.com'
};

// Initialize Google Auth
async function getGoogleAccessToken() {
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('❌ Google Auth Error:', error);
    throw error;
  }
}

// ==========================================
// AZURE DALL-E 3 IMAGE GENERATION
// ==========================================
async function generateWithAzureDallE(prompt, options = {}) {
  const {
    size = '1024x1024', // '1024x1024', '1792x1024', '1024x1792'
    quality = 'hd', // 'standard', 'hd'
    style = 'vivid' // 'vivid', 'natural'
  } = options;

  console.log('🎨 Azure DALL-E 3 Request:', { prompt, size, quality, style });

  const client = new OpenAI({
    apiKey: AZURE_DALLE.apiKey,
    baseURL: `${AZURE_DALLE.endpoint}openai/deployments/${AZURE_DALLE.deploymentName}`,
    defaultQuery: { 'api-version': AZURE_DALLE.apiVersion },
    defaultHeaders: { 'api-key': AZURE_DALLE.apiKey }
  });

  const response = await client.images.generate({
    model: AZURE_DALLE.deploymentName,
    prompt: prompt,
    n: 1,
    size: size,
    quality: quality,
    style: style,
    response_format: 'url'
  });

  console.log('✅ Azure DALL-E 3 Generation Complete');

  return {
    provider: 'Azure DALL-E 3',
    images: response.data.map((img, idx) => ({
      index: idx + 1,
      url: img.url,
      revisedPrompt: img.revised_prompt
    }))
  };
}

// ==========================================
// GOOGLE IMAGEN 3 IMAGE GENERATION
// ==========================================
async function generateWithGoogleImagen(prompt, options = {}) {
  const {
    numberOfImages = 1,
    aspectRatio = '1:1',
    negativePrompt = '',
    safetyFilterLevel = 'block_some',
    personGeneration = 'allow_adult'
  } = options;

  console.log('🎨 Google Imagen 3 Request:', { prompt, aspectRatio, numberOfImages });

  const accessToken = await getGoogleAccessToken();
  const apiUrl = `${VERTEX_CONFIG.endpoint}/v1/projects/${VERTEX_CONFIG.projectId}/locations/${VERTEX_CONFIG.location}/publishers/google/models/${VERTEX_CONFIG.model}:predict`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [{
        prompt: prompt,
        negativePrompt: negativePrompt
      }],
      parameters: {
        sampleCount: numberOfImages,
        aspectRatio: aspectRatio,
        safetyFilterLevel: safetyFilterLevel,
        personGeneration: personGeneration,
        addWatermark: false,
        compressionQuality: 100,
        language: 'auto'
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ Imagen API Error:', errorData);
    throw new Error(`Imagen API Error: ${response.status}`);
  }

  const result = await response.json();
  console.log('✅ Google Imagen 3 Generation Complete');

  const predictions = result.predictions || [];
  return {
    provider: 'Google Imagen 3',
    images: predictions.map((pred, idx) => ({
      index: idx + 1,
      bytesBase64Encoded: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || 'image/png',
      dataUrl: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`
    }))
  };
}

// ==========================================
// OPENAI DALL-E 3 (FALLBACK)
// ==========================================
async function generateWithOpenAIDallE(prompt, options = {}) {
  const { size = '1024x1024', quality = 'hd', style = 'vivid' } = options;

  console.log('🎨 OpenAI DALL-E 3 Request:', { prompt, size, quality, style });

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: size,
    quality: quality,
    style: style,
    response_format: 'url'
  });

  console.log('✅ OpenAI DALL-E 3 Generation Complete');

  return {
    provider: 'OpenAI DALL-E 3',
    images: response.data.map((img, idx) => ({
      index: idx + 1,
      url: img.url,
      revisedPrompt: img.revised_prompt
    }))
  };
}

// ==========================================
// MULTI-PROVIDER IMAGE GENERATION
// ==========================================
async function generateImage(prompt, options = {}) {
  const providers = [];

  // Priority 1: Azure DALL-E 3
  if (AZURE_DALLE.enabled()) {
    providers.push({
      name: 'Azure DALL-E 3',
      generate: () => generateWithAzureDallE(prompt, options)
    });
  }

  // Priority 2: Google Imagen 3
  if (VERTEX_CONFIG.enabled()) {
    providers.push({
      name: 'Google Imagen 3',
      generate: () => generateWithGoogleImagen(prompt, options)
    });
  }

  // Priority 3: OpenAI DALL-E 3 (Fallback)
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'OpenAI DALL-E 3',
      generate: () => generateWithOpenAIDallE(prompt, options)
    });
  }

  if (providers.length === 0) {
    throw new Error('No image generation providers available');
  }

  // Try providers in order
  for (const provider of providers) {
    try {
      console.log(`🎨 Attempting ${provider.name}...`);
      const result = await provider.generate();
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      if (provider === providers[providers.length - 1]) {
        throw error; // Last provider failed, throw error
      }
      console.log(`⚡ Falling back to next provider...`);
    }
  }
}

// ==========================================
// API HANDLER
// ==========================================
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const startTime = Date.now();

  try {
    const {
      prompt,
      // Azure DALL-E options
      size = '1024x1024',
      quality = 'hd',
      style = 'vivid',
      // Google Imagen options
      numberOfImages = 1,
      aspectRatio = '1:1',
      negativePrompt = '',
      safetyFilterLevel = 'block_some',
      personGeneration = 'allow_adult'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Görsel açıklaması gerekli'
      });
    }

    // Generate image with multi-provider fallback
    const result = await generateImage(prompt, {
      size,
      quality,
      style,
      numberOfImages,
      aspectRatio,
      negativePrompt,
      safetyFilterLevel,
      personGeneration
    });

    const responseTime = Date.now() - startTime;

    // NEVER reveal which AI was used
    res.status(200).json({
      success: true,
      type: 'image',
      images: result.images,
      count: result.images.length,
      provider: 'LyDian AI', // Hidden - never reveal actual provider
      model: 'Enterprise AI', // Generic name
      actualProvider: result.provider, // For logging only (remove in production)
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      metadata: {
        prompt: prompt.substring(0, 100),
        quality: 'Ultra HD 8K',
        technology: 'Advanced Neural Art Generation'
      }
    });

  } catch (error) {
    console.error('❌ Image Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Görsel oluşturma başarısız oldu',
      message: 'Lütfen daha detaylı bir açıklama deneyin veya tekrar deneyin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
