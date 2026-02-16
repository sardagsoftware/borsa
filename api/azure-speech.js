/* global fetch */
/**
 * Azure Speech Services API
 * - Speech-to-Text (Ses → Metin)
 * - Text-to-Speech (Metin → Ses - Bayan ses)
 */

const { getCorsOrigin } = require('./_middleware/cors');
const { applySanitization } = require('./_middleware/sanitize');
module.exports = async (req, res) => {
  applySanitization(req, res);
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, text, audioData } = req.body;

  // Azure Speech Configuration
  const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
  const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return res.status(503).json({
      success: false,
      error: 'Azure Speech service is not configured',
      message: 'AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION ortam değişkenlerini tanımlayın.',
    });
  }

  try {
    if (action === 'text-to-speech') {
      // Text-to-Speech: Metin → Ses (Bayan ses)
      const ssml = `
<speak version='1.0' xml:lang='tr-TR'>
    <voice name='tr-TR-EmelNeural'>
        <prosody rate='1.0' pitch='0%'>
            ${text}
        </prosody>
    </voice>
</speak>`.trim();

      const ttsResponse = await fetch(
        `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
          },
          body: ssml,
        }
      );

      if (!ttsResponse.ok) {
        throw new Error(`Azure TTS Error: ${ttsResponse.status}`);
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      return res.status(200).json({
        success: true,
        audio: audioBase64,
        format: 'mp3',
        voice: 'tr-TR-EmelNeural (Bayan)',
      });
    } else if (action === 'speech-to-text') {
      // Speech-to-Text: Ses → Metin
      // Browser Web Speech API kullanacağız (client-side)
      // Bu endpoint sadece fallback için
      return res.status(200).json({
        success: true,
        message: 'Speech-to-Text browser tarafında çalışır',
        useWebSpeechAPI: true,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: text-to-speech or speech-to-text',
      });
    }
  } catch (error) {
    console.error('❌ Azure Speech API Error:', error);

    return res.status(500).json({
      success: false,
      error: 'Speech service error',
      message: 'Ses tanıma hatası',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
