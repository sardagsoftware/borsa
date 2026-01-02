/**
 * AI Chat Service Tests
 * Tests for the extracted AI chat microservice
 */

const request = require('supertest');
const AIChatService = require('../../services/ai-chat-service');

describe('AI Chat Service', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with test configuration (no real API keys)
    service = new AIChatService({
      port: 0, // Random port for testing
      enableOpenAI: true,
      enableAnthropic: true,
      enableGroq: true,
      enableGemini: true,
      enableAzure: true,
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Service Information', () => {
    it('should return service info', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('service', 'ai-chat-service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('chat');
      expect(response.body.endpoints).toHaveProperty('models');
      expect(response.body).toHaveProperty('providers');
      expect(response.body.providers).toHaveProperty('total', 10);
    });
  });

  describe('GET /api/models', () => {
    it('should return all AI models', async () => {
      const response = await request(app).get('/api/models').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('available_count');
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });

    it('should include model properties', async () => {
      const response = await request(app).get('/api/models').expect(200);

      const firstModel = response.body.models[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('provider');
      expect(firstModel).toHaveProperty('tokens');
      expect(firstModel).toHaveProperty('category');
      expect(firstModel).toHaveProperty('description');
      expect(firstModel).toHaveProperty('capabilities');
      expect(firstModel).toHaveProperty('available');
    });
  });

  describe('POST /api/chat', () => {
    it('should reject request without model', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('required');
    });

    it('should reject request without message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          model: 'OX7A3F8D',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('required');
    });

    it('should reject unknown model', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          model: 'unknown-model-12345',
          message: 'Hello',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle chat request with fallback (no API key)', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          model: 'OX7A3F8D',
          message: 'Hello, how are you?',
          temperature: 0.7,
          max_tokens: 100,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('usage');
      expect(response.body.usage).toHaveProperty('prompt_tokens');
      expect(response.body.usage).toHaveProperty('completion_tokens');
      expect(response.body.usage).toHaveProperty('total_tokens');
    });

    it('should handle chat with conversation history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          model: 'OX7A3F8D', // Use a model that exists in test config
          message: 'What about the previous topic?',
          history: [
            { role: 'user', content: 'Tell me about AI' },
            { role: 'assistant', content: 'AI is artificial intelligence.' },
          ],
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
    });

    it('should handle code generation request', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          model: 'GX8E2D9A',
          message: 'Write a JavaScript function to reverse a string',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toContain('function');
    });
  });

  describe('POST /api/chat/specialized', () => {
    it('should reject request without message', async () => {
      const response = await request(app).post('/api/chat/specialized').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('required');
    });

    it('should handle code generation AI type', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Create a function to sort an array',
          aiType: 'code',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('aiType', 'code');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toContain('function');
    });

    it('should handle reasoning AI type', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Explain quantum computing step by step',
          aiType: 'reasoning',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('aiType', 'reasoning');
      expect(response.body).toHaveProperty('response');
    });

    it('should handle image analysis AI type', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Analyze this image: [image_url]',
          aiType: 'image',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('aiType', 'image');
      expect(response.body).toHaveProperty('response');
    });

    it('should handle chat AI type', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Tell me a joke',
          aiType: 'chat',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('aiType', 'chat');
      expect(response.body).toHaveProperty('response');
    });

    it('should detect language', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Merhaba, nasılsınız?',
          aiType: 'chat',
        })
        .expect(200);

      expect(response.body).toHaveProperty('language');
      expect(['tr', 'en']).toContain(response.body.language);
    });

    it('should accept language parameter', async () => {
      const response = await request(app)
        .post('/api/chat/specialized')
        .send({
          message: 'Hello',
          aiType: 'chat',
          language: 'en',
        })
        .expect(200);

      expect(response.body).toHaveProperty('language', 'en');
    });
  });

  describe('POST /api/chat/gpt5', () => {
    it('should reject request without message', async () => {
      const response = await request(app).post('/api/chat/gpt5').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle GPT-5 chat request', async () => {
      const response = await request(app)
        .post('/api/chat/gpt5')
        .send({
          message: 'What is machine learning?',
        })
        .expect(500); // Will fail without API key, but tests routing

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('unavailable');
    });
  });

  describe('POST /api/chat/AX9F7E2B', () => {
    it('should reject request without message', async () => {
      const response = await request(app).post('/api/chat/AX9F7E2B').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle AX9F7E2B chat request', async () => {
      const response = await request(app)
        .post('/api/chat/AX9F7E2B')
        .send({
          message: 'Explain neural networks',
        })
        .expect(500); // Will fail without API key

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/chat/gemini', () => {
    it('should reject request without message', async () => {
      const response = await request(app).post('/api/chat/gemini').send({}).expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle Gemini chat request', async () => {
      const response = await request(app)
        .post('/api/chat/gemini')
        .send({
          message: 'What is deep learning?',
        })
        .expect(500); // Will fail without API key

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Utility Functions', () => {
    it('should detect Turkish language', () => {
      const turkish = service.detectLanguage('Merhaba, nasılsınız? Bu bir Türkçe metindir.');
      expect(turkish).toBe('tr');
    });

    it('should detect English language', () => {
      const english = service.detectLanguage('Hello, how are you? This is an English text.');
      expect(english).toBe('en');
    });

    it('should estimate tokens correctly', () => {
      const shortText = 'Hello';
      const longText =
        'This is a longer text that should have more estimated tokens than the short one.';

      const shortTokens = service.estimateTokens(shortText);
      const longTokens = service.estimateTokens(longText);

      expect(shortTokens).toBeGreaterThan(0);
      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    it('should generate fallback code response', () => {
      const response = service.generateCodeResponse('Create a sorting function');
      expect(response).toContain('function');
      expect(response).toContain('```');
    });

    it('should generate fallback reasoning response', () => {
      const response = service.generateReasoningResponse('Explain quantum mechanics');
      expect(response).toContain('step by step');
      expect(response).toContain('Analysis');
    });

    it('should generate fallback image analysis response', () => {
      const response = service.generateImageAnalysisResponse('Analyze this image');
      expect(response).toContain('Image Analysis');
      expect(response).toContain('Scene');
    });

    it('should generate fallback general response', () => {
      const response = service.generateGeneralResponse('Hello AI');
      expect(response).toContain('Thank you');
      expect(response).toContain('fallback');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/unknown-endpoint').expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/unknown-endpoint');
    });
  });

  describe('Service Management', () => {
    it('should start and stop service', async () => {
      const testService = new AIChatService({
        port: 0,
        enableOpenAI: false,
      });

      const server = await testService.start();
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);

      await testService.stop();
      expect(server.listening).toBe(false);
    });

    it('should provide access to Express app', () => {
      const testService = new AIChatService({
        enableOpenAI: false,
      });

      const app = testService.getApp();
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });

  describe('AI Models Configuration', () => {
    it('should initialize models with correct structure', () => {
      expect(service.aiModels).toBeDefined();
      expect(Array.isArray(service.aiModels)).toBe(true);
      expect(service.aiModels.length).toBeGreaterThan(0);

      const model = service.aiModels[0];
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('category');
      expect(model).toHaveProperty('capabilities');
      expect(model).toHaveProperty('available');
    });

    it('should have multiple providers', () => {
      const providers = [...new Set(service.aiModels.map(m => m.provider))];
      expect(providers.length).toBeGreaterThan(5);
    });

    it('should have multiple categories', () => {
      const categories = [...new Set(service.aiModels.map(m => m.category))];
      expect(categories.length).toBeGreaterThan(3);
    });
  });

  describe('Fallback Response Generation', () => {
    it('should generate code response for code-related message', () => {
      const model = service.aiModels[0];
      const response = service.generateFallbackResponse('Write a function to sort numbers', model);
      expect(response).toContain('function');
    });

    it('should generate explanation for how-to message', () => {
      const model = service.aiModels[0];
      const response = service.generateFallbackResponse('How does sorting work?', model);
      expect(response).toContain('Explanation');
    });

    it('should generate list for list-related message', () => {
      const model = service.aiModels[0];
      const response = service.generateFallbackResponse(
        'List the best programming languages',
        model
      );
      expect(response).toContain('List');
    });

    it('should generate analysis for analyze-related message', () => {
      const model = service.aiModels[0];
      const response = service.generateFallbackResponse('Analyze the market trends', model);
      expect(response).toContain('Analysis');
    });

    it('should generate general response for other messages', () => {
      const model = service.aiModels[0];
      const response = service.generateFallbackResponse('Random question', model);
      expect(response).toContain('Thank you');
    });
  });
});

describe('AI Chat Service - Provider API Integration Tests', () => {
  let service;

  beforeAll(() => {
    service = new AIChatService({
      port: 0,
      enableOpenAI: true,
      enableAnthropic: true,
    });
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('API Integration Error Handling', () => {
    it('should throw error when Anthropic API key not configured', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      await expect(service.callAnthropicAPI('test', [], 0.7, 100)).rejects.toThrow(
        'not configured'
      );

      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should throw error when OpenAI API key not configured', async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(service.callOpenAIAPI('test', [], 0.7, 100)).rejects.toThrow('not configured');

      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });

    it('should throw error when Groq API key not configured', async () => {
      const originalKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;

      await expect(service.callGroqAPI('test', [], 0.7, 100, 'GX4B7F3C')).rejects.toThrow(
        'not configured'
      );

      if (originalKey) process.env.GROQ_API_KEY = originalKey;
    });

    it('should throw error when Google AI API key not configured', async () => {
      const originalKey = process.env.GOOGLE_AI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      await expect(service.callGoogleGeminiAPI('test', [], 0.7, 100)).rejects.toThrow(
        'not configured'
      );

      if (originalKey) process.env.GOOGLE_AI_API_KEY = originalKey;
    });

    it('should throw error when Azure API not configured', async () => {
      const originalKey = process.env.AZURE_OPENAI_API_KEY;
      delete process.env.AZURE_OPENAI_API_KEY;

      await expect(service.callAzureOpenAIAPI('test', [], 0.7, 100, 'model')).rejects.toThrow(
        'not configured'
      );

      if (originalKey) process.env.AZURE_OPENAI_API_KEY = originalKey;
    });
  });
});
