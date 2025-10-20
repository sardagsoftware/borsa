// AI Chat API - Enterprise Language Model Integration
// Secure obfuscation layer for AI provider isolation

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { handleCORS } = require('../security/cors-config');
const aiObfuscator = require('../lib/security/ai-obfuscator');

// AI Configuration - Environment-based
const AI_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.PRIMARY_AI_KEY;

// AI Model Configurations - Obfuscated Names
const AI_MODELS = {
  'strategic-reasoning': {
    name: aiObfuscator.resolveModel('STRATEGIC_REASONING_ENGINE'),
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Most intelligent AI model'
  },
  'strategic-reasoning-latest': {
    name: aiObfuscator.resolveModel('STRATEGIC_REASONING_ENGINE'),
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Latest strategic reasoning model'
  },
  'advanced-processor': {
    name: aiObfuscator.resolveModel('ADVANCED_LANGUAGE_PROCESSOR'),
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Most powerful AI model'
  },
  'legacy-reasoning': {
    name: aiObfuscator.resolveModel('LEGACY_REASONING_V3'),
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Balanced performance and speed'
  },
  'rapid-response': {
    name: aiObfuscator.resolveModel('RAPID_RESPONSE_UNIT'),
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Fastest AI model'
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
  // 🔒 SECURE CORS - Whitelist-based, NO WILDCARD
  if (handleCORS(req, res)) return; // Handle OPTIONS preflight

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Validate API key
  if (!AI_API_KEY) {
    console.error('❌ AI API key not configured');
    return res.status(500).json({
      success: false,
      error: 'AI API not configured',
      message: 'Please configure AI service credentials'
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
      model = 'strategic-reasoning',
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
    if (!AI_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(AI_MODELS).join(', ')}`
      });
    }

    // Initialize AI client
    const anthropic = new Anthropic({
      apiKey: AI_API_KEY
    });

    // Prepare messages for AI
    const aiMessages = [];

    if (messages.length > 0) {
      // Use provided messages
      aiMessages.push(...messages);
    } else {
      // Single message
      aiMessages.push({
        role: 'user',
        content: message
      });
    }

    // Log request (obfuscated)
    console.log(`🤖 AI Request - Model: ${model}, Tokens: ${max_tokens}, Stream: ${stream}`);

    const requestParams = {
      model: AI_MODELS[model].name,
      messages: aiMessages,
      temperature: Math.max(0, Math.min(1, temperature)),
      max_tokens: Math.min(max_tokens, AI_MODELS[model].maxTokens)
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
          console.error('❌ Claude streaming error:', error);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
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

      console.log(`✅ AI Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'Lydian AI',
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        },
        stop_reason: response.stop_reason,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ AI API Error:', error);

    // Sanitize error messages to hide provider info
    const sanitizedError = aiObfuscator.sanitizeError(error);

    // Handle specific API errors
    if (error.status) {
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid AI API key'
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'AI service rate limit reached'
        });
      }

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: sanitizedError.message || 'Bad request to AI service'
        });
      }

      if (error.status === 529) {
        return res.status(503).json({
          success: false,
          error: 'Service overloaded',
          message: 'AI service is temporarily overloaded'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'AI request failed',
      message: sanitizedError.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Get available models
function getModels(req, res) {
  // 🔒 SECURE CORS - Whitelist-based, NO WILDCARD
  if (handleCORS(req, res)) return;

  res.status(200).json({
    success: true,
    models: Object.keys(AI_MODELS).map(key => ({
      id: key,
      ...AI_MODELS[key]
    }))
  });
}

// Export handlers
module.exports = {
  handleRequest,
  getModels,
  AI_MODELS
};
