// LyDian Vision Engine - Multimodal AI Integration
// LyDian Vision Engine Models

require('dotenv').config();
const axios = require('axios');
const { getCorsOrigin } = require('./_middleware/cors');

// Vision Engine Configuration
const _VEK = process.env.GOOGLE_AI_API_KEY;
const _VEB = Buffer.from(
  'aHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRh',
  'base64'
).toString();

// LyDian Vision Engine Models
const GEMINI_MODELS = {
  VX2F8A0E: {
    name: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'LyDian Vision Flash',
  },
  VX3T8R2E: {
    name: 'gemini-2.0-flash-thinking-exp-1219',
    maxTokens: 8192,
    contextWindow: 32000,
    description: 'LyDian Vision Reasoning',
  },
  GE6D8A4F: {
    name: 'GE6D8A4F',
    maxTokens: 8192,
    contextWindow: 2000000,
    description: 'LyDian Vision Pro',
  },
  VX1F5L0B: {
    name: 'gemini-1.5-flash',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'LyDian Vision Lite',
  },
  VX1F5L8B: {
    name: 'gemini-1.5-flash-8b',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'LyDian Vision Compact',
  },
};

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 60; // requests per minute
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

// Convert messages to Gemini format
function convertToGeminiFormat(messages, systemPrompt = null) {
  const geminiContents = [];
  let systemInstruction = systemPrompt;

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Accumulate system messages
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n\n${msg.content}`
        : msg.content;
    } else {
      // Convert user/assistant to Gemini's user/model format
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  return { contents: geminiContents, systemInstruction };
}

// Main request handler
async function handleRequest(req, res) {
  // Apply centralized sanitization + secure CORS
  const { applySanitization } = require('./_middleware/sanitize');
  applySanitization(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Validate API key
  if (!_VEK) {
    console.error('Vision engine key not configured');
    return res.status(500).json({
      success: false,
      error: 'Vision engine not configured',
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
      message,
      messages = [],
      model = 'VX2F8A0E',
      temperature = 1.0,
      max_tokens = 8192,
      stream = false,
      systemPrompt,
      topP = 0.95,
      topK = 40,
    } = req.body;

    // Validate required fields
    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message or messages array required',
      });
    }

    // Validate model
    if (!GEMINI_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(GEMINI_MODELS).join(', ')}`,
      });
    }

    // Prepare messages
    const messageArray = messages.length > 0 ? messages : [{ role: 'user', content: message }];
    const { contents, systemInstruction } = convertToGeminiFormat(messageArray, systemPrompt);

    // Log request
    console.log(`Vision Engine Request - Tokens: ${max_tokens}, Stream: ${stream}`);

    // Build API URL
    const modelName = GEMINI_MODELS[model].name;
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const apiUrl = `${_VEB}/models/${modelName}:${endpoint}?key=${_VEK}`;

    // Request body
    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: Math.max(0, Math.min(2, temperature)),
        maxOutputTokens: Math.min(max_tokens, GEMINI_MODELS[model].maxTokens),
        topP: topP,
        topK: topK,
      },
    };

    // Add system instruction if available
    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 60000,
        });

        let buffer = '';

        response.data.on('data', chunk => {
          buffer += chunk.toString();

          // Process complete JSON objects
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.candidates && data.candidates[0]?.content?.parts) {
                  const text = data.candidates[0].content.parts
                    .map(part => part.text || '')
                    .join('');

                  if (text) {
                    res.write(
                      `data: ${JSON.stringify({
                        type: 'content',
                        content: text,
                      })}\n\n`
                    );
                  }
                }
              } catch (parseError) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        });

        response.data.on('end', () => {
          res.write('data: [DONE]\n\n');
          res.end();
        });

        response.data.on('error', error => {
          console.error('❌ Vision Engine streaming error:', error.message);
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: 'Baglanti hatasi olustu. Lutfen tekrar deneyin.',
            })}\n\n`
          );
          res.end();
        });
      } catch (streamError) {
        console.error('❌ Vision Engine stream init error:', streamError.message);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: 'Baglanti baslatma hatasi. Lutfen tekrar deneyin.',
          })}\n\n`
        );
        res.end();
      }
    } else {
      // Non-streaming response
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const data = response.data;

      // Extract response text
      let responseText = '';
      if (data.candidates && data.candidates[0]?.content?.parts) {
        responseText = data.candidates[0].content.parts.map(part => part.text || '').join('');
      }

      // Extract usage metadata
      const usage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      };

      console.log(`Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'LyDian AI',
        usage: usage,
        finishReason: data.candidates[0]?.finishReason,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('❌ Vision Engine Error:', error.message);

    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        return res.status(401).json({
          success: false,
          error: 'Kimlik dogrulama hatasi. Lutfen tekrar giris yapin.',
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Istek limiti asildi. Lutfen biraz bekleyin.',
        });
      }

      if (status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Gecersiz istek. Lutfen girdinizi kontrol edin.',
        });
      }

      if (status === 503) {
        return res.status(503).json({
          success: false,
          error: 'Servis gecici olarak kulanilamiyor. Lutfen tekrar deneyin.',
        });
      }
    }

    console.error('❌ Vision Engine request error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Islem basarisiz oldu. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString(),
    });
  }
}

// Get available models
function getModels(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.status(200).json({
    success: true,
    models: Object.keys(GEMINI_MODELS).map(key => ({
      id: key,
      maxTokens: GEMINI_MODELS[key].maxTokens,
      contextWindow: GEMINI_MODELS[key].contextWindow,
      description: GEMINI_MODELS[key].description,
    })),
  });
}

// Export handlers
module.exports = {
  handleRequest,
  getModels,
  GEMINI_MODELS,
};
