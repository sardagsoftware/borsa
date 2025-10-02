// LyDian Voice TTS - ElevenLabs (Hidden)
const fetch = require('node-fetch');

// ElevenLabs Configuration (Hidden from user)
const ELEVENLABS = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
  // Turkish voice - Natural and professional
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Multilingual
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  }
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voice = 'default' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Metin gerekli'
      });
    }

    if (!ELEVENLABS.apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Ses servisi geçici olarak kullanılamıyor'
      });
    }

    // Call ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS.endpoint}/${ELEVENLABS.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: ELEVENLABS.voiceSettings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio as base64 (for easy frontend handling)
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    res.status(200).json({
      success: true,
      audio: audioBase64,
      format: 'mp3',
      provider: 'LyDian AI', // Never reveal ElevenLabs
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Voice TTS Error:', error);
    res.status(500).json({
      success: false,
      error: 'Ses oluşturma başarısız oldu',
      message: 'Lütfen tekrar deneyin'
    });
  }
};
