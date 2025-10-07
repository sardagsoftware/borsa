// Groq API - Ultra-fast LLM Inference
// Supports Llama 3.3, Mixtral, and other models

require('dotenv').config();
const OpenAI = require('openai');

// Groq Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Groq Model Configurations
const GROQ_MODELS = {
  'llama-3.3-70b': {
    name: 'llama-3.3-70b-versatile',
    maxTokens: 32768,
    contextWindow: 128000,
    description: 'Latest Llama 3.3 70B model'
  },
  'llama-3.1-70b': {
    name: 'llama-3.1-70b-versatile',
    maxTokens: 32768,
    contextWindow: 128000,
    description: 'Llama 3.1 70B versatile'
  },
  'mixtral-8x7b': {
    name: 'mixtral-8x7b-32768',
    maxTokens: 32768,
    contextWindow: 32768,
    description: 'Mixtral 8x7B MoE model'
  },
  'gemma2-9b': {
    name: 'gemma2-9b-it',
    maxTokens: 8192,
    contextWindow: 8192,
    description: 'Google Gemma 2 9B'
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

  if (!GROQ_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Groq API not configured'
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
      model = 'llama-3.3-70b',
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

    if (!GROQ_MODELS[model]) {
      return res.status(400).json({
        success: false,
        error: `Invalid model. Available: ${Object.keys(GROQ_MODELS).join(', ')}`
      });
    }

    const groq = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    const messageArray = messages.length > 0 ? messages : [{ role: 'user', content: message }];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS[model].name,
      messages: messageArray,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: Math.min(max_tokens, GROQ_MODELS[model].maxTokens),
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
        provider: 'Groq',
        usage: {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Groq API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Groq request failed',
      message: error.message
    });
  }
}

module.exports = { handleRequest, GROQ_MODELS };
