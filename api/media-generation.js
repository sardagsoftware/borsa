// LyDian Media Generation API - Video & Image (Hidden)
const fetch = require('node-fetch');
const { handleCORS } = require('../security/cors-config');

// Google AI Configuration (Hidden from user)
const GOOGLE_AI = {
  video: {
    model: 'veo-001',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo',
    key: process.env.GOOGLE_AI_KEY
  },
  image: {
    model: 'imagen-3',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImages',
    key: process.env.GOOGLE_AI_KEY
  }
};

module.exports = async (req, res) => {
  // CORS
  // 🔒 SECURE CORS - Whitelist-based
  if (handleCORS(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,
      type = 'image', // 'image' or 'video'
      aspectRatio = '1:1',
      duration = 5 // for video
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt gerekli' });
    }

    // Translate to English for better results (hidden from user)
    const translatedPrompt = await translateToEnglish(prompt);

    let result;

    if (type === 'video') {
      // Google Veo - Video Generation
      if (!GOOGLE_AI.video.key) {
        return res.status(500).json({
          success: false,
          error: 'Video oluşturma servisi geçici olarak kullanılamıyor'
        });
      }

      const response = await fetch(`${GOOGLE_AI.video.endpoint}?key=${GOOGLE_AI.video.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: translatedPrompt,
          duration: duration,
          aspectRatio: aspectRatio
        })
      });

      result = await response.json();

    } else {
      // Google Imagen - Image Generation
      if (!GOOGLE_AI.image.key) {
        return res.status(500).json({
          success: false,
          error: 'Resim oluşturma servisi geçici olarak kullanılamıyor'
        });
      }

      const response = await fetch(`${GOOGLE_AI.image.endpoint}?key=${GOOGLE_AI.image.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: translatedPrompt,
          number_of_images: 1,
          aspect_ratio: aspectRatio,
          safety_filter_level: 'block_some',
          person_generation: 'allow_adult'
        })
      });

      result = await response.json();
    }

    // Return WITHOUT revealing which AI was used
    res.status(200).json({
      success: true,
      type: type,
      result: result,
      provider: 'LyDian AI', // Never reveal Google
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Media Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Medya oluşturma başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};

// Helper: Translate Turkish to English (hidden)
async function translateToEnglish(text) {
  // Simple translation or use Azure Translator
  // For now, return as-is if English, or use basic translation
  return text;
}
