// Claude API - Anthropic Integration
// Supports Claude 3.5 Sonnet and other Claude models

const Anthropic = require('@anthropic-ai/sdk');

// Claude Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Claude Model Configurations
const CLAUDE_MODELS = {
  'claude-3-5-sonnet': {
    name: 'claude-3-5-sonnet-20250219',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Most intelligent Claude model'
  },
  'claude-3-5-sonnet-latest': {
    name: 'claude-3-5-sonnet-latest',
    maxTokens: 8192,
    contextWindow: 200000,
    description: 'Latest Claude 3.5 Sonnet'
  },
  'claude-3-opus': {
    name: 'claude-3-opus-20240229',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Most powerful Claude model'
  },
  'claude-3-sonnet': {
    name: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Balanced performance and speed'
  },
  'claude-3-haiku': {
    name: 'claude-3-haiku-20240307',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Fastest Claude model'
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
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      error: 'Claude API not configured',
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
      model = 'claude-3-5-sonnet',
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
    if (!CLAUDE_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(CLAUDE_MODELS).join(', ')}`
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    });

    // Prepare messages for Claude
    const claudeMessages = [];

    if (messages.length > 0) {
      // Use provided messages
      claudeMessages.push(...messages);
    } else {
      // Single message
      claudeMessages.push({
        role: 'user',
        content: message
      });
    }

    // Log request
    console.log(`🤖 Claude Request - Model: ${model}, Tokens: ${max_tokens}, Stream: ${stream}`);

    const requestParams = {
      model: CLAUDE_MODELS[model].name,
      messages: claudeMessages,
      temperature: Math.max(0, Math.min(1, temperature)),
      max_tokens: Math.min(max_tokens, CLAUDE_MODELS[model].maxTokens)
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

      console.log(`✅ Claude Response received - ${responseText.length} characters`);

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'Anthropic',
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        },
        stop_reason: response.stop_reason,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Claude API Error:', error);

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
          message: error.message || 'Bad request to Claude API'
        });
      }

      if (error.status === 529) {
        return res.status(503).json({
          success: false,
          error: 'Service overloaded',
          message: 'Claude API is temporarily overloaded'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Claude request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Get available models
function getModels(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    success: true,
    models: Object.keys(CLAUDE_MODELS).map(key => ({
      id: key,
      ...CLAUDE_MODELS[key]
    }))
  });
}

// Export handlers
module.exports = {
  handleRequest,
  getModels,
  CLAUDE_MODELS
};
