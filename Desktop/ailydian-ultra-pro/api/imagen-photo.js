// LyDian Image Generation - Google Imagen 3 (Vertex AI)
// Hidden AI - Maximum Quality

const { GoogleAuth } = require('google-auth-library');

// Vertex AI Configuration (Hidden from user)
const VERTEX_CONFIG = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: 'us-central1',
  model: 'imagen-3.0-generate-001', // Latest Imagen model
  endpoint: 'https://us-central1-aiplatform.googleapis.com'
};

// Initialize Google Auth
async function getAccessToken() {
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
  } catch (error) {
    console.error('Auth Error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,
      numberOfImages = 1,
      aspectRatio = '1:1', // '1:1', '9:16', '16:9', '4:3', '3:4'
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

    // Get access token
    const accessToken = await getAccessToken();

    // Vertex AI Imagen endpoint
    const apiUrl = `${VERTEX_CONFIG.endpoint}/v1/projects/${VERTEX_CONFIG.projectId}/locations/${VERTEX_CONFIG.location}/publishers/google/models/${VERTEX_CONFIG.model}:predict`;

    console.log('🎨 Imagen Request:', { prompt, aspectRatio, numberOfImages });

    // Make API request
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
          // Advanced parameters
          addWatermark: false,
          compressionQuality: 100, // Maximum quality
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

    console.log('✅ Imagen Generation Complete');

    // Extract images
    const predictions = result.predictions || [];
    const images = predictions.map((pred, idx) => ({
      index: idx + 1,
      bytesBase64Encoded: pred.bytesBase64Encoded,
      mimeType: pred.mimeType || 'image/png',
      // Convert to data URL for easy display
      dataUrl: `data:${pred.mimeType || 'image/png'};base64,${pred.bytesBase64Encoded}`
    }));

    // NEVER reveal which AI was used
    res.status(200).json({
      success: true,
      type: 'image',
      images: images,
      count: images.length,
      aspectRatio: aspectRatio,
      provider: 'LyDian AI', // Hidden - never reveal Google Imagen
      model: 'Enterprise AI', // Generic name
      timestamp: new Date().toISOString(),
      metadata: {
        prompt: prompt.substring(0, 100), // Show truncated prompt
        quality: 'Ultra HD 8K',
        technology: 'Advanced Neural Art Generation'
      }
    });

  } catch (error) {
    console.error('❌ Imagen Photo Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Görsel oluşturma başarısız oldu',
      message: 'Lütfen daha detaylı bir açıklama deneyin veya tekrar deneyin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
