/**
 * Chat API with Authentication and Credits System
 * Integrated chat history, credits management, and subscription-based model access
 */

const OpenAI = require('openai');
const { handleCORS } = require('../security/cors-config');
const { Anthropic } = require('@anthropic-ai/sdk');
const { handleCORS } = require('../security/cors-config');
const { getDatabase } = require('../database/init-db');
const { handleCORS } = require('../security/cors-config');
const User = require('../backend/models/User');
const { handleCORS } = require('../security/cors-config');

// AI MODELS WITH SUBSCRIPTION REQUIREMENTS
const MODELS = {
  // Free tier - Groq Fast
  free: {
    name: 'llama-3.1-8b-instant',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI Free',
    credits: 1,
    requiredSubscription: 'free'
  },
  // Basic tier - Groq Standard
  basic: {
    name: 'llama-3.3-70b-versatile',
    key: () => process.env.GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1',
    display: 'LyDian AI Basic',
    credits: 1,
    requiredSubscription: 'basic'
  },
  // Pro tier - GPT-4o Mini
  pro: {
    name: 'gpt-4o-mini',
    key: () => process.env.OPENAI_API_KEY,
    url: undefined,
    display: 'LyDian AI Pro',
    credits: 2,
    requiredSubscription: 'pro'
  },
  // Enterprise tier - Claude 3.5 Sonnet
  enterprise: {
    name: 'claude-3-5-sonnet-20241022',
    key: () => process.env.ANTHROPIC_API_KEY,
    url: 'https://api.anthropic.com/v1',
    display: 'LyDian AI Enterprise',
    credits: 3,
    requiredSubscription: 'enterprise',
    isAnthropic: true
  }
};

// SUBSCRIPTION LEVELS
const SUBSCRIPTION_LEVELS = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'enterprise': 3
};

// Multilingual system prompt
const getMultilingualSystem = () => {
  return {
    role: 'system',
    content: `You are LyDian AI, a universal multilingual assistant.

**CRITICAL RULE - AUTOMATIC LANGUAGE DETECTION:**
ALWAYS detect the user's question language and respond in THE SAME LANGUAGE.

**TURKISH:**
- Soru Türkçe ise → MUTLAKA Türkçe cevap ver
- Detaylı, kapsamlı ve profesyonel yanıtlar
- Markdown formatında düzgün yapı

**ENGLISH:**
- If question is in English → Respond in English
- Detailed, comprehensive, professional answers
- Proper Markdown formatting

**ARABIC:**
- إذا كان السؤال بالعربية → أجب بالعربية
- إجابات مفصلة واحترافية

NEVER reveal AI model names. Always identify as "LyDian AI".`
  };
};

/**
 * Verify token and get user
 */
const authenticateRequest = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const decoded = User.verifyToken(token);
  if (!decoded) {
    throw new Error('Invalid or expired token');
  }

  const user = User.findById(decoded.id);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Check if user has access to requested model
 */
const checkModelAccess = (user, modelKey) => {
  const model = MODELS[modelKey];
  if (!model) {
    return false;
  }

  const userLevel = SUBSCRIPTION_LEVELS[user.subscription] || 0;
  const requiredLevel = SUBSCRIPTION_LEVELS[model.requiredSubscription] || 0;

  return userLevel >= requiredLevel;
};

/**
 * Save chat message to history
 */
const saveChatMessage = (userId, role, content, modelUsed, tokensUsed, creditsUsed) => {
  const db = getDatabase();
  try {
    db.prepare(`
      INSERT INTO chat_history (userId, role, content, modelUsed, tokensUsed, creditsUsed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, role, content, modelUsed, tokensUsed || 0, creditsUsed || 0);
  } finally {
    db.close();
  }
};

/**
 * Get chat history for user
 */
const getChatHistory = (userId, limit = 50) => {
  const db = getDatabase();
  try {
    const history = db.prepare(`
      SELECT role, content, modelUsed, tokensUsed, createdAt
      FROM chat_history
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).all(userId, limit);

    return history.reverse(); // Return in chronological order
  } finally {
    db.close();
  }
};

/**
 * Call Anthropic Claude API
 */
const callAnthropicAPI = async (model, messages, temperature, maxTokens) => {
  const client = new Anthropic({
    apiKey: model.key()
  });

  // Separate system message from conversation
  const systemMessage = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await client.messages.create({
    model: model.name,
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemMessage?.content || '',
    messages: conversationMessages
  });

  return {
    content: response.content[0].text,
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens
    }
  };
};

/**
 * Call OpenAI-compatible API
 */
const callOpenAIAPI = async (model, messages, temperature, maxTokens) => {
  const client = new OpenAI({
    apiKey: model.key(),
    baseURL: model.url
  });

  const completion = await client.chat.completions.create({
    model: model.name,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens
  });

  return {
    content: completion.choices[0].message.content,
    usage: completion.usage
  };
};

/**
 * Main Chat Handler
 */
module.exports = async (req, res) => {
  // 🔒 SECURE CORS - Whitelist-based
  if (handleCORS(req, res)) return;

  // GET - Retrieve chat history
  if (req.method === 'GET') {
    try {
      const user = authenticateRequest(req);
      const limit = parseInt(req.query.limit) || 50;

      const history = getChatHistory(user.id, limit);

      return res.status(200).json({
        success: true,
        history,
        user: {
          id: user.id,
          name: user.name,
          subscription: user.subscription,
          credits: user.credits
        }
      });

    } catch (error) {
      console.error('Get history error:', error);
      return res.status(401).json({
        success: false,
        error: error.message || 'Failed to get chat history'
      });
    }
  }

  // POST - Send chat message
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = authenticateRequest(req);

    const {
      message,
      history = [],
      temperature = 0.9,
      max_tokens = 8000,
      modelKey = 'free' // Default to free model
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get model configuration
    const model = MODELS[modelKey];
    if (!model) {
      return res.status(400).json({
        success: false,
        error: 'Invalid model selected'
      });
    }

    // Check subscription access
    if (!checkModelAccess(user, modelKey)) {
      return res.status(403).json({
        success: false,
        error: `This model requires ${model.requiredSubscription} subscription or higher`,
        requiredSubscription: model.requiredSubscription,
        currentSubscription: user.subscription
      });
    }

    // Check credits
    const requiredCredits = model.credits;
    if (user.credits < requiredCredits) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient credits',
        required: requiredCredits,
        available: user.credits
      });
    }

    // Prepare messages
    const cleanHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const messages = [
      getMultilingualSystem(),
      ...cleanHistory,
      { role: 'user', content: message }
    ];

    // Call appropriate API
    let response;
    let usage;

    if (model.isAnthropic) {
      const result = await callAnthropicAPI(model, messages, temperature, max_tokens);
      response = result.content;
      usage = result.usage;
    } else {
      const result = await callOpenAIAPI(model, messages, temperature, max_tokens);
      response = result.content;
      usage = result.usage;
    }

    // Save user message to history
    saveChatMessage(user.id, 'user', message, model.display, 0, 0);

    // Save assistant response to history
    saveChatMessage(user.id, 'assistant', response, model.display, usage.total_tokens, requiredCredits);

    // Deduct credits
    User.updateUsage(user.id, {
      chatMessages: 1,
      creditsUsed: requiredCredits
    });

    // Log activity
    User.logActivity({
      userId: user.id,
      action: 'chat_message',
      description: `Chat message using ${model.display}`,
      metadata: { model: modelKey, tokens: usage.total_tokens, credits: requiredCredits }
    });

    // Get updated user info
    const updatedUser = User.findById(user.id);

    res.status(200).json({
      success: true,
      response: response,
      model: model.display,
      usage: usage,
      credits: {
        used: requiredCredits,
        remaining: updatedUser.credits
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    const statusCode = error.message.includes('Authentication') ? 401 :
                       error.message.includes('Insufficient') ? 403 :
                       error.message.includes('subscription') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
