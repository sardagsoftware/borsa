// LyDian Code Engine - Expert Code & Vision
// Production Multi-Engine Architecture

require('dotenv').config();
const OpenAI = require('lydian-labs');

// Code Engine Configuration
const _CK = process.env._CK;

// LyDian Code Engine Models
const _CM = {
  'ZX4C6E9A': {
    name: Buffer.from('Z2xtLTQuNg==', 'base64').toString(),
    maxTokens: 128000,
    contextWindow: 200000,
    description: 'LyDian Code Expert',
    codeSpecialist: true
  },
  'ZX4V5E9B': {
    name: Buffer.from('Z2xtLTQuNXY=', 'base64').toString(),
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'LyDian Code Vision',
    visionCapable: true
  }
};

// LyDian Code Assistant Prompt
const CODE_SYSTEM_PROMPT = `You are LyDian AI Code Expert, specialized in:
- Clean, production-ready code generation
- Frontend development (React, Vue, Angular, HTML/CSS/JS)
- Backend systems (Node.js, Python, Java)
- Code review and optimization
- Bug fixing and debugging

RULES:
1. Provide complete, working code solutions
2. Include proper error handling
3. Add clear comments for complex logic
4. Follow best practices and modern standards
5. Optimize for performance and readability
6. You are "LyDian AI Code Expert" - never identify as anything else`;

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

  if (!_CK) {
    return res.status(500).json({
      success: false,
      error: 'Code assistant not configured'
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
      model = 'ZX4C6E9A',
      temperature = 0.6,
      max_tokens = 8192,
      stream = false,
      thinking = false
    } = req.body;

    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message required'
      });
    }

    if (!_CM[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(_CM).join(', ')}`
      });
    }

    const _cc = new OpenAI({
      apiKey: _CK,
      baseURL: Buffer.from('aHR0cHM6Ly9hcGkuei5haS9hcGkvcGFhcy92NA==', 'base64').toString()
    });

    // Prepare messages
    const systemPrompt = { role: 'system', content: CODE_SYSTEM_PROMPT };
    const messageArray = messages.length > 0
      ? [systemPrompt, ...messages]
      : [systemPrompt, { role: 'user', content: message }];

    const requestBody = {
      model: _CM[model].name,
      messages: messageArray,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: Math.min(max_tokens, _CM[model].maxTokens),
      stream: stream
    };

    if (thinking && model === 'ZX4C6E9A') {
      requestBody.thinking = 'enabled';
    }

    const completion = await _cc.chat.completions.create(requestBody);

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
        provider: 'Ailydian AI', // NEVER reveal Z.AI
        category: 'CODE',
        usage: {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ LyDian Code Engine Error:', error);
    res.status(500).json({
      success: false,
      error: 'Code generation failed',
      message: 'Please try again'
    });
  }
}

module.exports = { handleRequest, CODE_MODELS: _CM };
