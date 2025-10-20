// LyDian Voice TTS - Azure Speech Services (Primary) + ElevenLabs (Fallback)
// Multi-Provider with Hidden AI

const fetch = require('node-fetch');
const { handleCORS } = require('../security/cors-config');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const { handleCORS } = require('../security/cors-config');

// ==========================================
// AZURE SPEECH SERVICES CONFIGURATION (PRIMARY)
// ==========================================
const AZURE_SPEECH = {
  enabled: () => !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
  key: process.env.AZURE_SPEECH_KEY || process.env.AZURE_OPENAI_API_KEY, // Fallback to OpenAI key
  region: process.env.AZURE_SPEECH_REGION || 'swedencentral',
  // Turkish Neural Voices (High Quality)
  voices: {
    female: 'tr-TR-EmelNeural', // Natural Turkish female voice
    male: 'tr-TR-AhmetNeural',   // Natural Turkish male voice
    default: 'tr-TR-EmelNeural'
  },
  // Voice styles
  styles: ['cheerful', 'sad', 'angry', 'fearful', 'friendly', 'newscast', 'customerservice']
};

// ==========================================
// ELEVENLABS CONFIGURATION (FALLBACK)
// ==========================================
const ELEVENLABS = {
  enabled: () => !!process.env.ELEVENLABS_API_KEY,
  apiKey: process.env.ELEVENLABS_API_KEY,
  endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Multilingual
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  }
};

// ==========================================
// AZURE SPEECH SERVICES TTS
// ==========================================
async function generateWithAzureSpeech(text, options = {}) {
  const {
    voice = AZURE_SPEECH.voices.default,
    style = 'friendly',
    rate = '0%', // -50% to +50%
    pitch = '0%' // -50% to +50%
  } = options;

  console.log('🗣️ Azure Speech Request:', { text: text.substring(0, 50), voice, style });

  return new Promise((resolve, reject) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        AZURE_SPEECH.key,
        AZURE_SPEECH.region
      );

      speechConfig.speechSynthesisVoiceName = voice;
      speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;

      const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

      // SSML for advanced voice control
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
               xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="tr-TR">
          <voice name="${voice}">
            <mstts:express-as style="${style}">
              <prosody rate="${rate}" pitch="${pitch}">
                ${text}
              </prosody>
            </mstts:express-as>
          </voice>
        </speak>
      `;

      synthesizer.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('✅ Azure Speech Generation Complete');
            synthesizer.close();

            resolve({
              provider: 'Azure Speech Services',
              audioData: Buffer.from(result.audioData),
              format: 'audio/mpeg',
              sampleRate: 24000,
              bitRate: 48
            });
          } else {
            const error = `Azure Speech Error: ${result.errorDetails}`;
            console.error('❌', error);
            synthesizer.close();
            reject(new Error(error));
          }
        },
        (error) => {
          console.error('❌ Azure Speech Error:', error);
          synthesizer.close();
          reject(error);
        }
      );
    } catch (error) {
      console.error('❌ Azure Speech Setup Error:', error);
      reject(error);
    }
  });
}

// ==========================================
// ELEVENLABS TTS
// ==========================================
async function generateWithElevenLabs(text, options = {}) {
  console.log('🗣️ ElevenLabs Request:', { text: text.substring(0, 50) });

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
    const errorText = await response.text();
    console.error('❌ ElevenLabs Error:', errorText);
    throw new Error(`ElevenLabs Error: ${response.status}`);
  }

  const audioBuffer = await response.buffer();
  console.log('✅ ElevenLabs Generation Complete');

  return {
    provider: 'ElevenLabs',
    audioData: audioBuffer,
    format: 'audio/mpeg'
  };
}

// ==========================================
// MULTI-PROVIDER TTS
// ==========================================
async function generateVoice(text, options = {}) {
  const providers = [];

  // Priority 1: Azure Speech Services
  if (AZURE_SPEECH.enabled()) {
    providers.push({
      name: 'Azure Speech Services',
      generate: () => generateWithAzureSpeech(text, options)
    });
  }

  // Priority 2: ElevenLabs
  if (ELEVENLABS.enabled()) {
    providers.push({
      name: 'ElevenLabs',
      generate: () => generateWithElevenLabs(text, options)
    });
  }

  if (providers.length === 0) {
    throw new Error('No TTS providers available');
  }

  // Try providers in order
  for (const provider of providers) {
    try {
      console.log(`🗣️ Attempting ${provider.name}...`);
      const result = await provider.generate();
      return result;
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error.message);
      if (provider === providers[providers.length - 1]) {
        throw error; // Last provider failed
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
  // 🔒 SECURE CORS - Whitelist-based
  if (handleCORS(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const startTime = Date.now();

  try {
    const {
      text,
      voice = 'default',
      style = 'friendly',
      rate = '0%',
      pitch = '0%'
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Metin gerekli'
      });
    }

    // Generate voice with multi-provider fallback
    const result = await generateVoice(text, {
      voice,
      style,
      rate,
      pitch
    });

    const responseTime = Date.now() - startTime;

    // Return audio directly
    res.setHeader('Content-Type', result.format);
    res.setHeader('X-Provider', 'LyDian AI'); // Hidden
    res.setHeader('X-Actual-Provider', result.provider); // For logging
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.status(200).send(result.audioData);

  } catch (error) {
    console.error('❌ Voice Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Ses oluşturma başarısız oldu',
      message: 'Lütfen tekrar deneyin',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
