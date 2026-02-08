/* global fetch */
// ============================================
// 🔒 AI PROXY ENDPOINT (PHASE 1 - WHITE HAT)
// Unified proxy for all AI providers
// Hides provider details from client
// ============================================

const { getSession } = require('../lib/auth/redis-session-store');

// Model registry (maps model IDs to providers)
const MODEL_REGISTRY = {
  m1: { provider: 'azure-openai', deployment: 'OX7A3F8D' },
  m2: { provider: 'azure-openai', deployment: 'OX7A3F8D' },
  m3: { provider: 'azure-openai', deployment: 'OX7A3F8D-mini' },
  m4: { provider: 'lydian-labs', model: 'OX5C9E2B' },
  m5: { provider: 'lydian-research', model: 'AX9F7E2B' },
  m6: { provider: 'lydian-vision', model: 'VX2F8A0E' },
  m7: { provider: 'lydian-velocity', model: 'GX4B7F3C' },
  m8: { provider: 'lydian-velocity', model: 'GX3C7D5F' },

  // Legacy mappings for backward compatibility
  default: { provider: 'azure-openai', deployment: 'OX7A3F8D' },
  medical: { provider: 'azure-openai', deployment: 'OX7A3F8D' },
  legal: { provider: 'azure-openai', deployment: 'OX7A3F8D' },
  general: { provider: 'azure-openai', deployment: 'OX7A3F8D-mini' },
  coding: { provider: 'lydian-research', model: 'AX9F7E2B' },
};

// Rate limiting (simple in-memory for now, should be Redis-based in production)
const rateLimits = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  if (!rateLimits.has(identifier)) {
    rateLimits.set(identifier, []);
  }

  const requests = rateLimits.get(identifier);
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000) };
  }

  recentRequests.push(now);
  rateLimits.set(identifier, recentRequests);

  return { allowed: true };
}

async function callProvider(provider, config, messages, options) {
  const { provider: providerName, model, deployment } = provider;

  switch (providerName) {
    case 'azure-openai':
      return await callAzureOpenAI(deployment, messages, options);

    case 'lydian-labs':
      return await callOpenAI(model, messages, options);

    case 'lydian-research':
      return await callAnthropic(model, messages, options);

    case 'lydian-vision':
      return await callGoogle(model, messages, options);

    case 'lydian-velocity':
      return await callGroq(model, messages, options);

    default:
      throw new Error('Unknown provider');
  }
}

async function callAzureOpenAI(deployment, messages, options) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

  if (!endpoint || !apiKey) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  return await response.json();
}

async function callOpenAI(model, messages, options) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI credentials not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  return await response.json();
}

async function callAnthropic(model, messages, options) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic credentials not configured');
  }

  // Convert OpenAI format to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  const data = await response.json();

  // Convert Anthropic format back to OpenAI format
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: data.content[0].text,
        },
        finish_reason: data.stop_reason,
      },
    ],
    usage: data.usage,
  };
}

async function callGoogle(model, messages, options) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Google AI credentials not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  const data = await response.json();

  // Convert Google format to OpenAI format
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

async function callGroq(model, messages, options) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq credentials not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Provider error: ${response.status}`);
  }

  return await response.json();
}

module.exports = async (req, res) => {
  // CORS
  const allowedOrigins = [
    'https://www.ailydian.com',
    'https://ailydian.com',
    'https://ailydian-ultra-pro.vercel.app',
    'http://localhost:3000',
    'http://localhost:3100',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication
    const cookies = req.headers.cookie || '';
    const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);

    if (!sessionIdMatch) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sessionId = sessionIdMatch[1];
    const session = await getSession(sessionId);

    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(session.userId);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', rateLimit.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: rateLimit.retryAfter,
      });
    }

    // Parse request
    const { model, messages, options = {} } = req.body;

    if (!model || !messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve model from registry
    const providerConfig = MODEL_REGISTRY[model];

    if (!providerConfig) {
      return res.status(400).json({ error: 'Invalid model ID' });
    }

    // Call provider
    const response = await callProvider(providerConfig, {}, messages, options);

    // Return response (without exposing provider details)
    return res.status(200).json({
      success: true,
      response: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error('[AI Proxy] Error:', error.message);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};
