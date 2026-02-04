/* global fetch */
/**
 * AILYDIAN Voice Chat API
 * Voice-to-Voice conversation with Turkish TTS/STT
 *
 * @route POST /api/voice/chat
 * @version 1.0.0
 */

const { obfuscation } = require('../../services/localrecall');

// ============================================================
// IDENTITY PROTECTION - CRITICAL
// ============================================================
const IDENTITY_PROTECTION = `
Sen "LyDian AI" asistanisin. ASLA baska bir AI model adi soyleme.
GPT, Claude, Llama, Gemini, Mistral, Groq veya baska model adi ASLA belirtme.
Kimligin soruldugunda: "Ben LyDian AI asistaniyim" de.
Hangi model oldugun soruldugunda: "LyDian'in ozel gelistirdigi bir AI motoruyum" de.
Meta, OpenAI, Anthropic, Google gibi sirket adlari ASLA soyleme.
Turkce konusurken dogal ve arkadas gibi samimi ol. Kisa ve ozu cevaplar ver.
`;

const VOICE_SYSTEM_PROMPT = `${IDENTITY_PROTECTION}
Sen LyDian AI sesli asistanisin. Kullanici seninle sesli konusuyor.
- Kisa, net ve anlasilir cevaplar ver (1-3 cumle ideal)
- Dogal ve samimi bir ton kullan, sanki arkadasinla konusuyorsun
- Karmasik konulari basit acikla
- Sorulara direkt cevap ver, gereksiz giris yapma
- Turkce konusurken dogal ol, robot gibi olma
Her zaman Turkce yanit ver.`;

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { timestamp: now, count: 1 });
    return { allowed: true };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }
  record.count++;
  return { allowed: true };
}

// Get client IP
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    '127.0.0.1'
  );
}

/**
 * Transcribe audio using Groq Whisper API
 */
async function transcribeAudio(audioBuffer) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('Speech service not configured');
  }

  // Create form data with audio
  const FormData = (await import('form-data')).default;
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename: 'audio.webm',
    contentType: 'audio/webm',
  });
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'tr');
  formData.append('response_format', 'json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[VOICE_TRANSCRIBE_ERR]', error);
    throw new Error('Transcription failed');
  }

  const result = await response.json();
  return result.text;
}

/**
 * Get AI response using Groq
 */
async function getAIResponse(userMessage, conversationHistory = []) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('AI service not configured');
  }

  const messages = [{ role: 'system', content: VOICE_SYSTEM_PROMPT }];

  // Add conversation history (last 6 messages for voice context)
  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-6);
    for (const msg of recent) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 500, // Shorter for voice
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error('AI response failed');
  }

  const data = await response.json();
  let text = data.choices[0].message.content;

  // Sanitize AI model names
  text = obfuscation.sanitizeModelNames(text);

  return text;
}

/**
 * Synthesize speech using Azure TTS
 */
async function synthesizeSpeech(text) {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION || 'swedencentral';

  if (!speechKey) {
    throw new Error('TTS service not configured');
  }

  // Use Turkish female voice
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="tr-TR">
      <voice name="tr-TR-EmelNeural">
        <prosody rate="1.05" pitch="+2%">
          ${text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}
        </prosody>
      </voice>
    </speak>
  `;

  const response = await fetch(
    `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      },
      body: ssml,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[VOICE_TTS_ERR]', error);
    throw new Error('Speech synthesis failed');
  }

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return res.status(429).json({ success: false, error: 'Too many requests' });
    }

    const { audio, text, conversationHistory, mode } = req.body;

    let userMessage = text;

    // If audio provided, transcribe it
    if (audio && !text) {
      // Decode base64 audio
      const audioBuffer = Buffer.from(audio, 'base64');
      userMessage = await transcribeAudio(audioBuffer);
    }

    if (!userMessage || userMessage.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    console.log('[VOICE_CHAT] User:', userMessage.substring(0, 100));

    // Get AI response
    const aiResponse = await getAIResponse(userMessage, conversationHistory);
    console.log('[VOICE_CHAT] AI:', aiResponse.substring(0, 100));

    // If mode is 'text-only', return without audio
    if (mode === 'text-only') {
      return res.status(200).json({
        success: true,
        userMessage,
        response: aiResponse,
        audio: null,
      });
    }

    // Synthesize speech
    const audioBuffer = await synthesizeSpeech(aiResponse);
    const audioBase64 = audioBuffer.toString('base64');

    return res.status(200).json({
      success: true,
      userMessage,
      response: aiResponse,
      audio: audioBase64,
      audioFormat: 'mp3',
    });
  } catch (error) {
    console.error('[VOICE_CHAT_ERR]', error.message);
    return res.status(500).json({
      success: false,
      error: 'Voice chat failed. Please try again.',
    });
  }
};
