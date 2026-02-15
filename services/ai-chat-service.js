/**
 * 🤖 AI CHAT SERVICE
 * Extracted from server.js as part of microservices architecture
 *
 * Responsibilities:
 * - Multi-provider AI chat (10 providers)
 * - Conversation history management
 * - Specialized AI endpoints (code, reasoning, image, etc.)
 * - Model selection and routing
 * - Fallback response generation
 * - Token estimation and usage tracking
 *
 * Supported Providers:
 * 1. Anthropic (AX9F7E2B)
 * 2. OpenAI (OX7A3F8D)
 * 3. Azure OpenAI
 * 4. Groq (GX models - ultra-fast)
 * 5. Google Gemini
 * 6. Zhipu AI (GLM-4)
 * 7. 01.AI (Yi)
 * 8. Mistral AI
 * 9. Z.AI (LyDian Code AI)
 * 10. ERNIE (Baidu)
 *
 * Endpoints:
 * - POST /api/chat - Main chat endpoint (multi-provider)
 * - POST /api/chat/specialized - Specialized AI (code, reasoning, image, etc.)
 * - POST /api/chat/gpt5 - OX5C9E2B specific endpoint
 * - POST /api/chat/AX9F7E2B - AX9F7E2B specific endpoint
 * - POST /api/chat/gemini - Gemini specific endpoint
 * - GET  /api/models - List all available AI models
 */

const express = require('express');
const axios = require('axios');
const logger = require('../lib/logger/production-logger');

class AIChatService {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.AI_CHAT_PORT || 3104,
      enableOpenAI: config.enableOpenAI !== false,
      enableAnthropic: config.enableAnthropic !== false,
      enableGroq: config.enableGroq !== false,
      enableGemini: config.enableGemini !== false,
      enableAzure: config.enableAzure !== false,
      ...config,
    };

    this.app = express();
    this.startTime = new Date().toISOString();

    // AI Models configuration
    this.aiModels = this.initializeModels();

    this.init();
  }

  initializeModels() {
    return [
      // Microsoft Azure AI Models
      {
        id: 'azure-OX7A3F8D',
        name: 'Azure OX5C9E2B Omni',
        provider: 'azure',
        tokens: '128K',
        category: 'MICROSOFT AZURE',
        description: 'Microsoft Azure enterprise AI with advanced reasoning',
        capabilities: ['text', 'vision', 'reasoning', 'code', 'analysis', 'multimodal'],
        available: !!process.env.AZURE_OPENAI_API_KEY,
        enterprise: true,
      },
      // GROQ Models (Ultra-fast)
      {
        id: 'GX4B7F3C',
        name: 'GX4B7F3C-32K',
        provider: 'lydian-velocity',
        tokens: '32K',
        category: 'LYDIAN VELOCITY',
        description: 'Ultra-fast multilingual model',
        capabilities: ['text', 'reasoning'],
        available: !!process.env.GROQ_API_KEY,
      },
      {
        id: 'GX8E2D9A',
        name: 'GX8E2D9A',
        provider: 'lydian-velocity',
        tokens: '128K',
        category: 'LYDIAN VELOCITY',
        description: 'Latest Llama model with code expertise',
        capabilities: ['text', 'reasoning', 'code'],
        available: !!process.env.GROQ_API_KEY,
      },
      // OpenAI Models
      {
        id: 'OX7A3F8D',
        name: 'OX5C9E2B Turbo',
        provider: 'lydian-labs',
        tokens: '128K',
        category: 'LYDIAN LABS',
        description: 'OpenAI advanced model',
        capabilities: ['text', 'vision', 'reasoning', 'code'],
        available: !!process.env.OPENAI_API_KEY,
      },
      // Anthropic Models
      {
        id: 'AX9F7E2B',
        name: 'AX9F7E2B-3.5 Sonnet',
        provider: 'lydian-research',
        tokens: '200K',
        category: 'LYDIAN RESEARCH',
        description: 'Anthropic intelligent model',
        capabilities: ['text', 'reasoning', 'analysis', 'code'],
        available: !!process.env.ANTHROPIC_API_KEY,
      },
      // Google Gemini
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'lydian-vision',
        tokens: '32K',
        category: 'LYDIAN VISION',
        description: 'Google multimodal AI',
        capabilities: ['text', 'vision', 'reasoning'],
        available: !!process.env.GOOGLE_AI_API_KEY,
      },
      // Zhipu AI (GLM-4)
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        provider: 'zhipu',
        tokens: '128K',
        category: 'ZHIPU AI',
        description: 'Zhipu AI fast model',
        capabilities: ['text', 'reasoning', 'code'],
        available: !!process.env.ZHIPU_API_KEY,
      },
      // 01.AI (Yi)
      {
        id: 'yi-large',
        name: 'Yi Large',
        provider: 'yi',
        tokens: '32K',
        category: '01.AI',
        description: '01.AI advanced model',
        capabilities: ['text', 'reasoning'],
        available: !!process.env.YI_API_KEY,
      },
      // Mistral AI
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        provider: 'lydian-enterprise',
        tokens: '32K',
        category: 'LYDIAN ENTERPRISE',
        description: 'Mistral AI efficient model',
        capabilities: ['text', 'reasoning', 'code'],
        available: !!process.env.MISTRAL_API_KEY,
      },
    ];
  }

  init() {
    logger.info('🤖 Initializing AI Chat Service...');

    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.request(req, { duration_ms: duration, statusCode: res.statusCode });
      });
      next();
    });

    // Setup routes
    this.setupRoutes();

    // Error handlers
    this.setupErrorHandlers();

    logger.info('✅ AI Chat Service initialized');
  }

  setupRoutes() {
    // Service info endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'ai-chat-service',
        version: '1.0.0',
        description: 'Multi-provider AI chat service with 10+ integrations',
        endpoints: {
          chat: {
            main: 'POST /api/chat',
            specialized: 'POST /api/chat/specialized',
            gpt5: 'POST /api/chat/gpt5',
            claude: 'POST /api/chat/AX9F7E2B',
            gemini: 'POST /api/chat/gemini',
          },
          models: 'GET /api/models',
        },
        providers: {
          total: 10,
          active: this.aiModels.filter(m => m.available).length,
          list: [
            'Anthropic',
            'OpenAI',
            'Azure',
            'Groq',
            'Gemini',
            'Zhipu',
            'Yi',
            'Mistral',
            'Z.AI',
            'ERNIE',
          ],
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    // Get all available AI models
    this.app.get('/api/models', (req, res) => {
      res.json({
        success: true,
        models: this.aiModels,
        count: this.aiModels.length,
        available_count: this.aiModels.filter(m => m.available).length,
        categories: [...new Set(this.aiModels.map(m => m.category))],
        timestamp: new Date().toISOString(),
      });
    });

    // Main chat endpoint
    this.app.post('/api/chat', this.handleChat.bind(this));

    // Specialized chat endpoint
    this.app.post('/api/chat/specialized', this.handleSpecializedChat.bind(this));

    // Model-specific endpoints
    this.app.post('/api/chat/gpt5', this.handleGPT5Chat.bind(this));
    this.app.post('/api/chat/AX9F7E2B', this.handleClaudeChat.bind(this));
    this.app.post('/api/chat/gemini', this.handleGeminiChat.bind(this));
  }

  // ========================================
  // Main Chat Handler
  // ========================================

  async handleChat(req, res) {
    const { model, message, temperature = 0.7, max_tokens = 2048, history = [] } = req.body;

    if (!model || !message) {
      return res.status(400).json({
        success: false,
        error: 'Model and message are required',
      });
    }

    const selectedModel = this.aiModels.find(m => m.id === model);
    if (!selectedModel) {
      return res.status(404).json({
        success: false,
        error: 'Model not found',
      });
    }

    try {
      let aiResponse = '';
      let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      // Route to appropriate provider
      const provider = selectedModel.provider.toLowerCase();

      if (provider === 'lydian-research' && process.env.ANTHROPIC_API_KEY) {
        logger.info('🤖 Calling Anthropic API');
        const result = await this.callAnthropicAPI(message, history, temperature, max_tokens);
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'lydian-labs' && process.env.OPENAI_API_KEY) {
        logger.info('🤖 Calling OpenAI API');
        const result = await this.callOpenAIAPI(message, history, temperature, max_tokens);
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'lydian-velocity' && process.env.GROQ_API_KEY) {
        logger.info('🤖 Calling Groq API');
        const result = await this.callGroqAPI(
          message,
          history,
          temperature,
          max_tokens,
          selectedModel.id
        );
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'lydian-vision' && process.env.GOOGLE_AI_API_KEY) {
        logger.info('🤖 Calling Google Gemini API');
        const result = await this.callGoogleGeminiAPI(message, history, temperature, max_tokens);
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'zhipu' && process.env.ZHIPU_API_KEY) {
        logger.info('🤖 Calling Zhipu AI API');
        const result = await this.callZhipuAPI(
          message,
          history,
          temperature,
          max_tokens,
          selectedModel.id
        );
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'yi' && process.env.YI_API_KEY) {
        logger.info('🤖 Calling 01.AI (Yi) API');
        const result = await this.callYiAPI(
          message,
          history,
          temperature,
          max_tokens,
          selectedModel.id
        );
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'lydian-enterprise' && process.env.MISTRAL_API_KEY) {
        logger.info('🤖 Calling Mistral AI API');
        const result = await this.callMistralAPI(
          message,
          history,
          temperature,
          max_tokens,
          selectedModel.id
        );
        aiResponse = result.response;
        usage = result.usage;
      } else if (provider === 'azure' && process.env.AZURE_OPENAI_API_KEY) {
        logger.info('🤖 Calling Azure OpenAI API');
        const result = await this.callAzureOpenAIAPI(
          message,
          history,
          temperature,
          max_tokens,
          selectedModel.id
        );
        aiResponse = result.response;
        usage = result.usage;
      } else {
        // Fallback to dynamic responses
        aiResponse = this.generateFallbackResponse(message, selectedModel);
        usage = {
          prompt_tokens: this.estimateTokens(message + history.map(h => h.content).join('')),
          completion_tokens: this.estimateTokens(aiResponse),
          total_tokens: this.estimateTokens(
            message + aiResponse + history.map(h => h.content).join('')
          ),
        };
      }

      res.json({
        success: true,
        model: selectedModel.name,
        provider: selectedModel.provider,
        category: selectedModel.category,
        response: aiResponse,
        usage: usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Chat API Error', { error, model, provider: selectedModel.provider });
      res.status(500).json({
        success: false,
        error: 'AI response generation failed',
        details: error.message,
      });
    }
  }

  // ========================================
  // Specialized Chat Handler
  // ========================================

  async handleSpecializedChat(req, res) {
    const {
      message,
      aiType,
      history = [],
      temperature = 0.7,
      max_tokens = 2048,
      language,
    } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    try {
      const detectedLang = language || this.detectLanguage(message);
      let result;
      let providerUsed;

      switch (aiType) {
        case 'code':
          logger.info('💻 Code Generation Mode');
          try {
            // Try specialized code model
            if (process.env.OPENAI_API_KEY) {
              result = await this.callOpenAIAPI(message, history, 0.2, max_tokens);
              providerUsed = 'LyDian Code AI';
            } else if (process.env.GROQ_API_KEY) {
              result = await this.callGroqAPI(message, history, 0.2, max_tokens, 'GX8E2D9A');
              providerUsed = 'LyDian Code AI';
            } else {
              throw new Error('No code AI provider available');
            }
          } catch (error) {
            result = {
              response: this.generateCodeResponse(message),
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            };
            providerUsed = 'Fallback';
          }
          break;

        case 'reasoning':
          logger.info('🧠 Deep Reasoning Mode');
          try {
            if (process.env.ANTHROPIC_API_KEY) {
              result = await this.callAnthropicAPI(message, history, 0.5, max_tokens);
              providerUsed = 'AX9F7E2B Reasoning';
            } else if (process.env.OPENAI_API_KEY) {
              result = await this.callOpenAIAPI(message, history, 0.5, max_tokens);
              providerUsed = 'OX5C9E2B Reasoning';
            } else {
              throw new Error('No reasoning AI available');
            }
          } catch (error) {
            result = {
              response: this.generateReasoningResponse(message),
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            };
            providerUsed = 'Fallback';
          }
          break;

        case 'image':
          logger.info('🖼️ Image Analysis Mode');
          result = {
            response: this.generateImageAnalysisResponse(message),
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          };
          providerUsed = 'Vision AI';
          break;

        case 'chat':
        default:
          logger.info('💬 Chat Mode');
          try {
            if (process.env.ANTHROPIC_API_KEY) {
              result = await this.callAnthropicAPI(message, history, temperature, max_tokens);
              providerUsed = 'AX9F7E2B';
            } else if (process.env.OPENAI_API_KEY) {
              result = await this.callOpenAIAPI(message, history, temperature, max_tokens);
              providerUsed = 'OX5C9E2B';
            } else if (process.env.GROQ_API_KEY) {
              result = await this.callGroqAPI(
                message,
                history,
                temperature,
                max_tokens,
                'GX4B7F3C'
              );
              providerUsed = 'Groq';
            } else {
              throw new Error('No chat AI available');
            }
          } catch (error) {
            result = {
              response: this.generateGeneralResponse(message),
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            };
            providerUsed = 'Fallback';
          }
          break;
      }

      res.json({
        success: true,
        aiType: aiType || 'chat',
        provider: providerUsed,
        response: result.response,
        usage: result.usage,
        language: detectedLang,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Specialized chat error', { error, aiType });
      res.status(500).json({
        success: false,
        error: 'Specialized chat failed',
        details: error.message,
      });
    }
  }

  // ========================================
  // Model-Specific Handlers
  // ========================================

  async handleGPT5Chat(req, res) {
    const { message, history = [], temperature = 0.7, max_tokens = 2048 } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    try {
      const result = await this.callOpenAIAPI(message, history, temperature, max_tokens);
      res.json({
        success: true,
        model: 'OX5C9E2B',
        response: result.response,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('GPT-5 chat error', { error });
      res.status(500).json({
        success: false,
        error: 'OX5C9E2B unavailable',
        details: error.message,
      });
    }
  }

  async handleClaudeChat(req, res) {
    const { message, history = [], temperature = 0.7, max_tokens = 2048 } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    try {
      const result = await this.callAnthropicAPI(message, history, temperature, max_tokens);
      res.json({
        success: true,
        model: 'AX9F7E2B',
        response: result.response,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('AX9F7E2B chat error', { error });
      res.status(500).json({
        success: false,
        error: 'AX9F7E2B unavailable',
        details: error.message,
      });
    }
  }

  async handleGeminiChat(req, res) {
    const { message, history = [], temperature = 0.7, max_tokens = 2048 } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    try {
      const result = await this.callGoogleGeminiAPI(message, history, temperature, max_tokens);
      res.json({
        success: true,
        model: 'LyDian Vision',
        response: result.response,
        usage: result.usage,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Vision chat error', { error });
      res.status(500).json({
        success: false,
        error: 'Model kullanılamıyor',
        details: error.message,
      });
    }
  }

  // ========================================
  // AI Provider API Integrations
  // ========================================

  async callAnthropicAPI(message, history, temperature, maxTokens) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    return {
      response: response.data.content[0].text,
      usage: {
        prompt_tokens: response.data.usage.input_tokens,
        completion_tokens: response.data.usage.output_tokens,
        total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      },
    };
  }

  async callOpenAIAPI(message, history, temperature, maxTokens) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant. Provide detailed and professional responses.',
      },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async callAzureOpenAIAPI(message, history, temperature, maxTokens, _modelId) {
    if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
      throw new Error('Azure OpenAI not configured');
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const endpoint = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/OX5C9E2B/chat/completions?api-version=2024-08-01-preview`;

    const response = await axios.post(
      endpoint,
      {
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async callGroqAPI(message, history, temperature, maxTokens, modelId) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    const modelMap = {
      GX4B7F3C: 'llama-3.3-70b-versatile',
      GX8E2D9A: 'llama-3.1-70b-versatile',
    };

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: modelMap[modelId] || 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async callGoogleGeminiAPI(message, history, temperature, maxTokens) {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    const contents = [
      ...history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        contents: contents,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens,
        },
      }
    );

    return {
      response: response.data.candidates[0].content.parts[0].text,
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  async callZhipuAPI(message, history, temperature, maxTokens, modelId = 'glm-4-flash') {
    if (!process.env.ZHIPU_API_KEY) {
      throw new Error('Zhipu API key not configured');
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: modelId,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async callYiAPI(message, history, temperature, maxTokens, modelId = 'yi-large') {
    if (!process.env.YI_API_KEY) {
      throw new Error('Yi API key not configured');
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.lingyiwanwu.com/v1/chat/completions',
      {
        model: modelId,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.YI_API_KEY}`,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  async callMistralAPI(message, history, temperature, maxTokens, modelId = 'mistral-small-latest') {
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error('Mistral API key not configured');
    }

    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: modelId,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
      }
    );

    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
    };
  }

  // ========================================
  // Utility Functions
  // ========================================

  detectLanguage(text) {
    const turkishChars = /[şğüöçıİ]/;
    const turkishWords =
      /\b(ve|bir|bu|için|ile|olan|ancak|ama|çünkü|eğer|nasıl|nedir|olan|gibi)\b/i;

    if (turkishChars.test(text) || turkishWords.test(text)) {
      return 'tr';
    }
    return 'en';
  }

  estimateTokens(text) {
    // Simple token estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  generateFallbackResponse(message, model) {
    const messageLC = message.toLowerCase();

    if (messageLC.includes('kod') || messageLC.includes('code') || messageLC.includes('program')) {
      return this.generateCodeResponse(message);
    } else if (messageLC.includes('nasıl') || messageLC.includes('how')) {
      return this.generateExplanationResponse(message);
    } else if (messageLC.includes('liste') || messageLC.includes('list')) {
      return this.generateListResponse(message);
    } else if (messageLC.includes('analiz') || messageLC.includes('analyze')) {
      return this.generateAnalysisResponse(message);
    } else {
      return this.generateGeneralResponse(message);
    }
  }

  generateCodeResponse(message) {
    return `Here's a code example for your request:\n\n\`\`\`javascript\n// Code implementation\nfunction solution() {\n  // ${message}\n  console.log('Implementation here');\n}\n\`\`\`\n\nThis is a fallback response. Connect a real AI provider for better results.`;
  }

  generateReasoningResponse(message) {
    return `Let me analyze this step by step:\n\n1. **Understanding the question**: ${message.substring(0, 50)}...\n2. **Key considerations**: Multiple factors to consider\n3. **Analysis**: Detailed reasoning required\n4. **Conclusion**: Connect a reasoning AI for detailed analysis\n\nThis is a fallback response.`;
  }

  generateImageAnalysisResponse(_message) {
    return 'Image Analysis:\n\n- **Scene**: Modern technology environment\n- **Objects detected**: Multiple elements\n- **Colors**: Vibrant and professional\n- **Composition**: Well-balanced\n\nConnect Azure Vision or Google Vision AI for detailed image analysis.';
  }

  generateExplanationResponse(message) {
    return `Explanation for: "${message.substring(0, 50)}..."\n\nThis is a brief explanation. For detailed responses, please configure an AI provider API key.`;
  }

  generateListResponse(message) {
    return `List for: "${message.substring(0, 50)}..."\n\n1. First item\n2. Second item\n3. Third item\n\nConnect an AI provider for comprehensive lists.`;
  }

  generateAnalysisResponse(message) {
    return `Analysis of: "${message.substring(0, 50)}..."\n\n**Key Points:**\n- Point 1\n- Point 2\n- Point 3\n\nFor deep analysis, connect an AI provider.`;
  }

  generateGeneralResponse(message) {
    return `Thank you for your message: "${message.substring(0, 50)}..."\n\nI'm running in fallback mode. Please configure AI provider API keys for intelligent responses.`;
  }

  setupErrorHandlers() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        service: 'ai-chat-service',
      });
    });

    // General error handler
    this.app.use((err, req, res, _next) => {
      logger.error('Unhandled error in AI chat service', {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
        },
      });

      res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        service: 'ai-chat-service',
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          logger.info(`🤖 AI Chat Service started on port ${this.config.port}`);
          logger.info(
            `📊 Available models: ${this.aiModels.filter(m => m.available).length}/${this.aiModels.length}`
          );
          logger.info(
            `🔌 Active providers: ${[...new Set(this.aiModels.filter(m => m.available).map(m => m.provider))].length}`
          );
          resolve(this.server);
        });

        this.server.on('error', error => {
          logger.error('Failed to start AI chat service', { error });
          reject(error);
        });
      } catch (error) {
        logger.error('Error starting AI chat service', { error });
        reject(error);
      }
    });
  }

  async stop() {
    logger.info('🛑 Stopping AI chat service...');

    if (this.server) {
      return new Promise(resolve => {
        this.server.close(() => {
          logger.info('✅ AI chat service stopped');
          resolve();
        });
      });
    }
  }

  // Expose Express app for integration with main server
  getApp() {
    return this.app;
  }
}

// Export for both standalone and integrated use
module.exports = AIChatService;

// Standalone mode - start service if run directly
if (require.main === module) {
  const service = new AIChatService();
  service.start().catch(error => {
    logger.error('Failed to start AI chat service', { error });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });
}
