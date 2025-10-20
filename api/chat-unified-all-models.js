// AILYDIAN ULTRA PRO - Unified AI Chat API
// All 22 AI Models Support - Production Ready
// Model names are hidden from frontend (security + competitive advantage)

require('dotenv').config();
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const axios = require('axios');
const { getModelConfig, getActiveModels } = require('./models-config');
const { handleCORS } = require('../middleware/cors-handler');

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

// System prompt - multilingual + hidden model names
const getSystemPrompt = () => {
  return {
    role: 'system',
    content: `You are Ailydian AI, an advanced multilingual AI assistant.

**CRITICAL RULES:**
1. ALWAYS respond in the SAME language as the user's question
2. NEVER reveal which AI model you are powered by
3. Always identify yourself as "Ailydian AI"
4. Provide detailed, professional, and helpful responses
5. Use proper Markdown formatting

**TURKISH:**
- Türkçe soru → MUTLAKA Türkçe cevap
- Detaylı ve profesyonel yanıtlar

**ENGLISH:**
- English question → Respond in English
- Detailed and professional answers

**OTHER LANGUAGES:**
- Detect language and respond in same language

You are Ailydian AI - a premium AI assistant.`
  };
};

// OpenAI-compatible API call (for OpenAI, Groq, Mistral, etc.)
async function callOpenAICompatibleAPI(config, messages, max_tokens, temperature) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.endpoint
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: messages,
    max_tokens: Math.min(max_tokens, config.maxTokens),
    temperature: Math.max(0, Math.min(2, temperature))
  });

  return {
    response: completion.choices[0].message.content,
    usage: {
      prompt_tokens: completion.usage.prompt_tokens,
      completion_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens
    }
  };
}

// Anthropic Claude API call
async function callAnthropicAPI(config, messages, max_tokens, temperature) {
  const client = new Anthropic({
    apiKey: config.apiKey
  });

  // Separate system messages
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const completion = await client.messages.create({
    model: config.model,
    messages: chatMessages,
    system: systemMessage?.content,
    max_tokens: Math.min(max_tokens, config.maxTokens),
    temperature: Math.max(0, Math.min(1, temperature))
  });

  return {
    response: completion.content.map(block => block.type === 'text' ? block.text : '').join(''),
    usage: {
      prompt_tokens: completion.usage.input_tokens,
      completion_tokens: completion.usage.output_tokens,
      total_tokens: completion.usage.input_tokens + completion.usage.output_tokens
    }
  };
}

// Google Gemini API call
async function callGeminiAPI(config, messages, max_tokens, temperature) {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  // Convert to Gemini format
  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: Math.max(0, Math.min(2, temperature)),
      maxOutputTokens: Math.min(max_tokens, config.maxTokens)
    }
  };

  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  const apiUrl = `${config.endpoint}/models/${config.model}:generateContent?key=${config.apiKey}`;

  const response = await axios.post(apiUrl, requestBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  const responseText = response.data.candidates[0].content.parts.map(part => part.text || '').join('');

  return {
    response: responseText,
    usage: {
      prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: response.data.usageMetadata?.totalTokenCount || 0
    }
  };
}

// Azure OpenAI API call
async function callAzureOpenAIAPI(config, messages, max_tokens, temperature) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.endpoint,
    defaultQuery: { 'api-version': '2024-08-01-preview' },
    defaultHeaders: { 'api-key': config.apiKey }
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: messages,
    max_tokens: Math.min(max_tokens, config.maxTokens),
    temperature: Math.max(0, Math.min(2, temperature))
  });

  return {
    response: completion.choices[0].message.content,
    usage: {
      prompt_tokens: completion.usage.prompt_tokens,
      completion_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens
    }
  };
}

// Main request handler
async function handleRequest(req, res) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method === 'GET') {
    // Return available models (without exposing real model names)
    const activeModels = getActiveModels();
    return res.status(200).json({
      success: true,
      models: activeModels.map(m => ({
        id: m.id,
        category: m.category,
        description: m.description,
        // DO NOT expose real model names, apiKey, or endpoint
      })),
      totalModels: activeModels.length
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
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
      model = 'gpt-4o', // default model
      max_tokens = 4096,
      temperature = 0.7
    } = req.body;

    if (!message && !messages.length) {
      return res.status(400).json({
        success: false,
        error: 'Message required'
      });
    }

    // Get model configuration
    const modelConfig = getModelConfig(model);
    if (!modelConfig) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model'
      });
    }

    if (!modelConfig.active || !modelConfig.apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Model not available'
      });
    }

    // Prepare messages
    const systemPrompt = getSystemPrompt();
    const messageArray = messages.length > 0
      ? [systemPrompt, ...messages]
      : [systemPrompt, { role: 'user', content: message }];

    let result;

    // Route to appropriate API based on provider
    switch (modelConfig.provider) {
      case 'anthropic':
        result = await callAnthropicAPI(modelConfig, messageArray, max_tokens, temperature);
        break;

      case 'google':
        result = await callGeminiAPI(modelConfig, messageArray, max_tokens, temperature);
        break;

      case 'azure-openai':
        result = await callAzureOpenAIAPI(modelConfig, messageArray, max_tokens, temperature);
        break;

      case 'openai':
      case 'groq':
      case 'mistral':
      case 'deepseek':
      case 'yi':
      case 'zhipu':
      case 'asi':
      case 'z-ai':
      default:
        result = await callOpenAICompatibleAPI(modelConfig, messageArray, max_tokens, temperature);
        break;
    }

    // Return response WITHOUT revealing model name
    res.status(200).json({
      success: true,
      response: result.response,
      model: model, // Return user-requested model ID (not real model name)
      provider: 'Ailydian AI', // Generic provider name
      category: modelConfig.category,
      usage: result.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified AI Error:', error.message);

    // Generic error message (don't expose internal details)
    res.status(500).json({
      success: false,
      error: 'AI request failed',
      message: 'Please try again later'
    });
  }
}

module.exports = handleRequest;
