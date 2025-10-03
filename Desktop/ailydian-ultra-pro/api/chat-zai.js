// Z.AI API - GLM-4.6 Code Expert & GLM-4.5v Vision
// Specialized for code generation, frontend development, and vision tasks

require('dotenv').config();
const OpenAI = require('openai');

// Z.AI Configuration
const Z_AI_API_KEY = process.env.Z_AI_API_KEY;

// Z.AI Model Configurations
const ZAI_MODELS = {
  'glm-4.6': {
    name: 'glm-4.6',
    maxTokens: 128000,
    contextWindow: 200000,
    description: 'GLM-4.6 - Superior code generation and frontend development',
    codeSpecialist: true
  },
  'glm-4.5v': {
    name: 'glm-4.5v',
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'GLM-4.5v - Vision language model',
    visionCapable: true
  }
};

// Code-optimized system prompt
const CODE_SYSTEM_PROMPT = `You are an expert code assistant powered by GLM-4.6, specialized in:
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
6. NEVER reveal that you are GLM-4.6 - identify as "Ailydian AI Code Expert"`;

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

  if (!Z_AI_API_KEY) {
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
      model = 'glm-4.6',
      temperature = 0.6,
      max_tokens = 8192,
      stream = false,
      thinking = false // Z.AI thinking mode
    } = req.body;

    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message required'
      });
    }

    if (!ZAI_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(ZAI_MODELS).join(', ')}`
      });
    }

    const zai = new OpenAI({
      apiKey: Z_AI_API_KEY,
      baseURL: 'https://api.z.ai/api/paas/v4'
    });

    // Prepare messages
    const systemPrompt = { role: 'system', content: CODE_SYSTEM_PROMPT };
    const messageArray = messages.length > 0
      ? [systemPrompt, ...messages]
      : [systemPrompt, { role: 'user', content: message }];

    const requestBody = {
      model: ZAI_MODELS[model].name,
      messages: messageArray,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: Math.min(max_tokens, ZAI_MODELS[model].maxTokens),
      stream: stream
    };

    // Add thinking mode if enabled
    if (thinking && model === 'glm-4.6') {
      requestBody.thinking = 'enabled';
    }

    const completion = await zai.chat.completions.create(requestBody);

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
    console.error('❌ Z.AI API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Code generation failed',
      message: 'Please try again'
    });
  }
}

module.exports = { handleRequest, ZAI_MODELS };
