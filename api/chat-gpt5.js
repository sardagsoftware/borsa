// GPT-5 API - Azure AI Foundry Integration
// Supports GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-5 Chat

require('dotenv').config();
const axios = require('axios');
const { getCorsOrigin } = require('./_middleware/cors');

// Azure AI Foundry Configuration
const AZURE_AI_FOUNDRY_ENDPOINT = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
const AZURE_AI_FOUNDRY_API_KEY = process.env.AZURE_AI_FOUNDRY_API_KEY;

// GPT-5 Model Configurations
const GPT5_MODELS = {
  'gpt-5': {
    name: 'gpt-5',
    maxTokens: 128000,
    description: 'Most advanced GPT-5 model'
  },
  'gpt-5-mini': {
    name: 'gpt-5-mini',
    maxTokens: 64000,
    description: 'Efficient GPT-5 variant'
  },
  'gpt-5-nano': {
    name: 'gpt-5-nano',
    maxTokens: 32000,
    description: 'Fast, lightweight GPT-5'
  },
  'gpt-5-chat': {
    name: 'gpt-5-chat',
    maxTokens: 128000,
    description: 'Optimized for conversations'
  }
};

// Rate limiting and request tracking
const requestLog = new Map();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

// Check rate limit
function checkRateLimit(userId = 'anonymous') {
  const now = Date.now();
  const userRequests = requestLog.get(userId) || [];

  // Clean old requests
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  requestLog.set(userId, recentRequests);
  return true;
}

// Main request handler
async function handleRequest(req, res) {
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
      error: 'Method not allowed'
    });
  }

  // Validate Azure credentials
  if (!AZURE_AI_FOUNDRY_ENDPOINT || !AZURE_AI_FOUNDRY_API_KEY) {
    console.error('❌ Azure AI Foundry credentials not configured');
    return res.status(500).json({
      success: false,
      error: 'Azure AI Foundry not configured',
      message: 'Please set AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_API_KEY'
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
      model = 'gpt-5',
      temperature = 0.7,
      max_tokens = 4096,
      stream = false,
      systemPrompt
    } = req.body;

    // Validate required fields
    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message or messages array required'
      });
    }

    // Validate model
    if (!GPT5_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(GPT5_MODELS).join(', ')}`
      });
    }

    // Prepare messages
    const chatMessages = [];

    if (systemPrompt) {
      chatMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    if (messages.length > 0) {
      chatMessages.push(...messages);
    } else {
      chatMessages.push({
        role: 'user',
        content: message
      });
    }

    // Log request
    console.log(`🤖 GPT-5 Request - Model: ${model}, Tokens: ${max_tokens}, Stream: ${stream}`);

    // Azure AI Foundry API call
    const apiUrl = `${AZURE_AI_FOUNDRY_ENDPOINT}/chat/completions`;

    const requestBody = {
      model: GPT5_MODELS[model].name,
      messages: chatMessages,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: Math.min(max_tokens, GPT5_MODELS[model].maxTokens),
      stream: stream
    };

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const response = await axios.post(apiUrl, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_AI_FOUNDRY_API_KEY
          },
          responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              res.write(line + '\n\n');
            }
          }
        });

        response.data.on('end', () => {
          res.write('data: [DONE]\n\n');
          res.end();
        });

        response.data.on('error', (error) => {
          console.error('❌ Streaming error:', error);
          res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
          res.end();
        });

      } catch (streamError) {
        console.error('❌ Stream initialization error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }

    } else {
      // Non-streaming response
      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_AI_FOUNDRY_API_KEY
        },
        timeout: 60000 // 60 second timeout
      });

      const completion = response.data;
      const responseText = completion.choices[0]?.message?.content || '';

      console.log(`✅ GPT-5 Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'Azure AI Foundry',
        usage: completion.usage || {},
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ GPT-5 API Error:', error.message);

    // Handle specific Azure errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      if (status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid Azure AI Foundry API key'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Azure AI Foundry rate limit reached'
        });
      }

      if (status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Gecersiz istek. Lutfen tekrar deneyin.'
        });
      }
    }

    console.error('❌ AI request error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Islem basarisiz oldu. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString()
    });
  }
}

// Export handler
module.exports = {
  handleRequest,
  GPT5_MODELS
};
