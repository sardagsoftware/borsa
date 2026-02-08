// AX9F7E2B API - Anthropic Integration
// Supports AX9F7E2B 3.5 Sonnet and other AX9F7E2B models

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { getCorsOrigin } = require('./_middleware/cors');

// AX9F7E2B Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// AX9F7E2B Model Configurations
const AX9F7E2B_MODELS = {
  'AX9F7E2B': {
    name: 'AX9F7E2B',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Most intelligent AX9F7E2B model'
  },
  'AX9F7E2B-latest': {
    name: 'AX9F7E2B',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Latest AX9F7E2B 3.5 Sonnet'
  },
  'AX4D8C1A': {
    name: 'AX4D8C1A',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Most powerful AX9F7E2B model'
  },
  'AX9F7E2B-3-sonnet': {
    name: 'AX9F7E2B-3-sonnet-20240229',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Balanced performance and speed'
  },
  'AX2B6E9F': {
    name: 'AX2B6E9F',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Fastest AX9F7E2B model'
  }
};

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 50; // requests per minute
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

  // Validate API key
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ Anthropic API key not configured');
    return res.status(500).json({
      success: false,
      error: 'AX9F7E2B API not configured',
      message: 'Please set ANTHROPIC_API_KEY environment variable'
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
      model = 'AX9F7E2B',
      temperature = 1.0,
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
    if (!AX9F7E2B_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(AX9F7E2B_MODELS).join(', ')}`
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    });

    // Prepare messages for AX9F7E2B
    const AX9F7E2BMessages = [];

    if (messages.length > 0) {
      // Use provided messages
      AX9F7E2BMessages.push(...messages);
    } else {
      // Single message
      AX9F7E2BMessages.push({
        role: 'user',
        content: message
      });
    }

    // Log request
    console.log(`🤖 AX9F7E2B Request - Model: ${model}, Tokens: ${max_tokens}, Stream: ${stream}`);

    const requestParams = {
      model: AX9F7E2B_MODELS[model].name,
      messages: AX9F7E2BMessages,
      temperature: Math.max(0, Math.min(1, temperature)),
      max_tokens: Math.min(max_tokens, AX9F7E2B_MODELS[model].maxTokens)
    };

    // Add system prompt if provided
    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await anthropic.messages.stream({
          ...requestParams,
          stream: true
        });

        // Handle stream events
        stream.on('text', (text) => {
          res.write(`data: ${JSON.stringify({
            type: 'content',
            content: text
          })}\n\n`);
        });

        stream.on('message', (message) => {
          // Stream completed
          res.write(`data: ${JSON.stringify({
            type: 'done',
            usage: message.usage
          })}\n\n`);
        });

        stream.on('error', (error) => {
          console.error('❌ AX9F7E2B streaming error:', error.message);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'Baglanti hatasi olustu. Lutfen tekrar deneyin.'
          })}\n\n`);
          res.end();
        });

        stream.on('end', () => {
          res.write('data: [DONE]\n\n');
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
      const response = await anthropic.messages.create(requestParams);

      const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      console.log(`✅ AX9F7E2B Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'lydian-research',
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        },
        stop_reason: response.stop_reason,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ AX9F7E2B API Error:', error);

    // Handle specific Anthropic errors
    if (error.status) {
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid Anthropic API key'
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Anthropic API rate limit reached'
        });
      }

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Gecersiz istek. Lutfen tekrar deneyin.'
        });
      }

      if (error.status === 529) {
        return res.status(503).json({
          success: false,
          error: 'Service overloaded',
          message: 'AX9F7E2B API is temporarily overloaded'
        });
      }
    }

    console.error('❌ AX9F7E2B request error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Islem basarisiz oldu. Lutfen tekrar deneyin.',
      timestamp: new Date().toISOString()
    });
  }
}

// Get available models
function getModels(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.status(200).json({
    success: true,
    models: Object.keys(AX9F7E2B_MODELS).map(key => ({
      id: key,
      ...AX9F7E2B_MODELS[key]
    }))
  });
}

// Export handlers
module.exports = {
  handleRequest,
  getModels,
  AX9F7E2B_MODELS
};
