// LyDian Velocity Engine - Ultra-fast Inference
// Production Multi-Engine Architecture

require('dotenv').config();
const OpenAI = require('lydian-labs');

// Velocity Engine Configuration
const _VK = process.env._VK;

// LyDian Velocity Engine Models
const _VM = {
  'GX8E2D9A': {
    name: 'GX8E2D9A',
    maxTokens: 32768,
    contextWindow: 128000,
    description: 'LyDian Velocity Prime'
  },
  'GX9A5E1D': {
    name: 'GX9A5E1D',
    maxTokens: 32768,
    contextWindow: 128000,
    description: 'LyDian Velocity Standard'
  },
  'GX4B7F3C': {
    name: 'GX4B7F3C',
    maxTokens: 32768,
    contextWindow: 32768,
    description: 'LyDian Velocity Ensemble'
  },
  'GX2G9B4A': {
    name: Buffer.from('Z2VtbWEyLTliLWl0', 'base64').toString(),
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'LyDian Velocity Compact'
  }
};

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

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

  if (!_VK) {
    return res.status(500).json({
      success: false,
      error: 'Velocity engine not configured'
    });
  }

  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded'
    });
  }

  try {
    const {
      message,
      messages = [],
      model = 'GX8E2D9A',
      temperature = 1.0,
      max_tokens = 8192,
      stream = false
    } = req.body;

    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message required'
      });
    }

    if (!_VM[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(_VM).join(', ')}`
      });
    }

    const _vc = new OpenAI({
      apiKey: _VK,
      baseURL: Buffer.from('aHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3Yx', 'base64').toString()
    });

    const messageArray = messages.length > 0 ? messages : [{ role: 'user', content: message }];

    const completion = await _vc.chat.completions.create({
      model: _VM[model].name,
      messages: messageArray,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: Math.min(max_tokens, _VM[model].maxTokens),
      stream: stream
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const responseText = completion.choices[0].message.content;

      res.status(200).json({
        success: true,
        response: responseText,
        model: model,
        provider: 'lydian-velocity',
        usage: {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ LyDian Velocity Error:', error);
    res.status(500).json({
      success: false,
      error: 'Request failed',
      message: error.message
    });
  }
}

module.exports = { handleRequest, VELOCITY_MODELS: _VM };
