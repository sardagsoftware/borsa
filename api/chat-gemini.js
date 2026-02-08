// Gemini API - Google AI Integration
// Supports Gemini 2.0 Flash and other Gemini models

require('dotenv').config();
const axios = require('axios');
const { getCorsOrigin } = require('_middleware/cors');

// Google AI Configuration
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GOOGLE_AI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Gemini Model Configurations
const GEMINI_MODELS = {
  'gemini-2.0-flash': {
    name: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Latest Gemini 2.0 Flash model'
  },
  'gemini-2.0-flash-thinking': {
    name: 'gemini-2.0-flash-thinking-exp-1219',
    maxTokens: 8192,
    contextWindow: 32000,
    description: 'Gemini with extended reasoning'
  },
  'GE6D8A4F': {
    name: 'GE6D8A4F',
    maxTokens: 8192,
    contextWindow: 2000000,
    description: 'Most capable Gemini 1.5 model'
  },
  'gemini-1.5-flash': {
    name: 'gemini-1.5-flash',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Fast and versatile Gemini 1.5'
  },
  'gemini-1.5-flash-8b': {
    name: 'gemini-1.5-flash-8b',
    maxTokens: 8192,
    contextWindow: 1000000,
    description: 'Efficient 8B parameter model'
  }
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
        parts: [{ text: msg.content }]
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
      error: 'Method not allowed'
    });
  }

  // Validate API key
  if (!GOOGLE_AI_API_KEY) {
    console.error('AI engine key not configured');
    return res.status(500).json({
      success: false,
      error: 'AI engine not configured'
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${RATE_LIMIT} requests per minute`
    });
  }

  try {
    const {
      message,
      messages = [],
      model = 'gemini-2.0-flash',
      temperature = 1.0,
      max_tokens = 8192,
      stream = false,
      systemPrompt,
      topP = 0.95,
      topK = 40
    } = req.body;

    // Validate required fields
    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message or messages array required'
      });
    }

    // Validate model
    if (!GEMINI_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(GEMINI_MODELS).join(', ')}`
      });
    }

    // Prepare messages
    const messageArray = messages.length > 0 ? messages : [{ role: 'user', content: message }];
    const { contents, systemInstruction } = convertToGeminiFormat(messageArray, systemPrompt);

    // Log request
    console.log(`Request - Model: ${model}, Tokens: ${max_tokens}, Stream: ${stream}`);

    // Build API URL
    const modelName = GEMINI_MODELS[model].name;
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const apiUrl = `${GOOGLE_AI_BASE_URL}/models/${modelName}:${endpoint}?key=${GOOGLE_AI_API_KEY}`;

    // Request body
    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: Math.max(0, Math.min(2, temperature)),
        maxOutputTokens: Math.min(max_tokens, GEMINI_MODELS[model].maxTokens),
        topP: topP,
        topK: topK
      }
    };

    // Add system instruction if available
    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
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
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        });

        let buffer = '';

        response.data.on('data', (chunk) => {
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
                    res.write(`data: ${JSON.stringify({
                      type: 'content',
                      content: text
                    })}\n\n`);
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

        response.data.on('error', (error) => {
          console.error('❌ Gemini streaming error:', error);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`);
          res.end();
        });

      } catch (streamError) {
        console.error('❌ Stream initialization error:', streamError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: streamError.message
        })}\n\n`);
        res.end();
      }

    } else {
      // Non-streaming response
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const data = response.data;

      // Extract response text
      let responseText = '';
      if (data.candidates && data.candidates[0]?.content?.parts) {
        responseText = data.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      }

      // Extract usage metadata
      const usage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      };

      console.log(`Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'LyDian AI',
        usage: usage,
        finishReason: data.candidates[0]?.finishReason,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);

    // Handle specific Google AI errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401 || status === 403) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid Google AI API key'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Google AI API rate limit reached'
        });
      }

      if (status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: errorData?.error?.message || 'Bad request to Gemini API'
        });
      }

      if (status === 503) {
        return res.status(503).json({
          success: false,
          error: 'Service unavailable',
          message: 'Gemini API is temporarily unavailable'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Gemini request failed',
      message: error.message,
      timestamp: new Date().toISOString()
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
      ...GEMINI_MODELS[key]
    }))
  });
}

// Export handlers
module.exports = {
  handleRequest,
  getModels,
  GEMINI_MODELS
};
