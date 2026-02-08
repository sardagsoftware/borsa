// Speech API - Azure Speech Services Integration
// Supports Speech-to-Text (Transcription) and Text-to-Speech (Synthesis)

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getCorsOrigin } = require('./_middleware/cors');

// Azure Speech Configuration
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

// Check rate limit
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

// Validate Azure credentials
function validateCredentials() {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return {
      valid: false,
      error: 'Azure Speech credentials not configured',
      message: 'Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION',
    };
  }
  return { valid: true };
}

// Speech-to-Text Handler (Transcription)
async function handleTranscribe(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Validate credentials
  const credCheck = validateCredentials();
  if (!credCheck.valid) {
    return res.status(500).json({
      success: false,
      error: credCheck.error,
      message: credCheck.message,
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${RATE_LIMIT} requests per minute`,
    });
  }

  try {
    const {
      audioData, // Base64 encoded audio
      audioUrl, // URL to audio file
      language = 'tr-TR', // Turkish by default
      format = 'wav', // Audio format: wav, mp3, ogg
    } = req.body;

    if (!audioData && !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio data or URL required',
      });
    }

    console.log(`🎤 Transcription Request - Language: ${language}, Format: ${format}`);

    // Configure speech recognition
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = language;

    // Save audio to temporary file if provided as base64
    let audioFilePath;
    let audioConfig;

    if (audioData) {
      // Decode base64 audio
      const audioBuffer = Buffer.from(audioData, 'base64');
      audioFilePath = path.join('/tmp', `speech-${uuidv4()}.${format}`);
      fs.writeFileSync(audioFilePath, audioBuffer);

      audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));
    } else if (audioUrl) {
      // Download audio from URL (simplified, in production use streaming)
      const axios = require('axios');
      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(response.data);
      audioFilePath = path.join('/tmp', `speech-${uuidv4()}.${format}`);
      fs.writeFileSync(audioFilePath, audioBuffer);

      audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(audioFilePath));
    }

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Perform recognition
    const transcription = await new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        result => {
          if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            resolve({
              text: result.text,
              duration: result.duration,
              offset: result.offset,
            });
          } else if (result.reason === sdk.ResultReason.NoMatch) {
            reject(new Error('No speech could be recognized'));
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(new Error(`Recognition canceled: ${cancellation.errorDetails}`));
          } else {
            reject(new Error('Recognition failed'));
          }
          recognizer.close();
        },
        error => {
          recognizer.close();
          reject(error);
        }
      );
    });

    // Cleanup temporary file
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    console.log(`✅ Transcription completed - ${transcription.text.length} characters`);

    res.status(200).json({
      success: true,
      text: transcription.text,
      language: language,
      duration: transcription.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Transcription Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Text-to-Speech Handler (Synthesis)
async function handleSynthesize(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Validate credentials
  const credCheck = validateCredentials();
  if (!credCheck.valid) {
    return res.status(500).json({
      success: false,
      error: credCheck.error,
      message: credCheck.message,
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${RATE_LIMIT} requests per minute`,
    });
  }

  try {
    const {
      text,
      language = 'tr-TR', // Turkish by default
      voice = 'tr-TR-EmelNeural', // Turkish female voice
      rate = '1.0', // Speech rate (0.5 - 2.0)
      pitch = '0%', // Pitch adjustment
      format = 'audio-16khz-32kbitrate-mono-mp3', // Output format
    } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text required',
      });
    }

    console.log(`🔊 Synthesis Request - Language: ${language}, Voice: ${voice}`);

    // Configure speech synthesis
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechSynthesisLanguage = language;
    speechConfig.speechSynthesisVoiceName = voice;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat[format] ||
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Create synthesizer
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    // Build SSML for advanced control
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    // Perform synthesis
    const audioData = await new Promise((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        ssml,
        result => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const audioBuffer = Buffer.from(result.audioData);
            resolve(audioBuffer.toString('base64'));
          } else if (result.reason === sdk.ResultReason.Canceled) {
            const cancellation = sdk.CancellationDetails.fromResult(result);
            reject(new Error(`Synthesis canceled: ${cancellation.errorDetails}`));
          } else {
            reject(new Error('Synthesis failed'));
          }
          synthesizer.close();
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    console.log(`✅ Synthesis completed - ${audioData.length} bytes`);

    res.status(200).json({
      success: true,
      audioData: audioData, // Base64 encoded audio
      format: format,
      voice: voice,
      language: language,
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Synthesis Error:', error.message);

    res.status(500).json({
      success: false,
      error: 'Synthesis failed',
      message: 'Ses isleme hatasi. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Get available voices
async function getVoices(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));

  // Validate credentials
  const credCheck = validateCredentials();
  if (!credCheck.valid) {
    return res.status(500).json({
      success: false,
      error: credCheck.error,
      message: credCheck.message,
    });
  }

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    const voicesList = await new Promise((resolve, reject) => {
      synthesizer.getVoicesAsync(
        result => {
          const voices = result.voices.map(v => ({
            name: v.shortName,
            displayName: v.localName,
            gender: v.gender,
            locale: v.locale,
          }));
          resolve(voices);
          synthesizer.close();
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    res.status(200).json({
      success: true,
      voices: voicesList,
      count: voicesList.length,
    });
  } catch (error) {
    console.error('❌ Get voices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voices',
      message: 'Ses isleme hatasi. Lutfen tekrar deneyin.',
    });
  }
}

// Export handlers
module.exports = {
  handleTranscribe,
  handleSynthesize,
  getVoices,
};
