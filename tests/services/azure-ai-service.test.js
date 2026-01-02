/**
 * Azure AI Service Tests
 * Tests for the extracted Azure AI microservice
 */

const request = require('supertest');
const AzureAIService = require('../../services/azure-ai-service');

describe('Azure AI Service', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with test configuration
    service = new AzureAIService({
      port: 0, // Random port for testing
      azureOpenAIEndpoint: 'https://test.openai.azure.com',
      azureOpenAIApiKey: 'test-api-key-for-testing',
      azureSubscriptionId: 'test-subscription-id',
      enableOpenAI: true,
      enableCognitiveServices: true,
      enableMetrics: true,
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

      expect(response.body).toHaveProperty('service', 'azure-ai-service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('openai');
      expect(response.body.endpoints).toHaveProperty('cognitive');
      expect(response.body.endpoints).toHaveProperty('metrics');
    });
  });

  describe('POST /api/azure-test', () => {
    it('should return test endpoint response', async () => {
      const response = await request(app).post('/api/azure-test').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Azure AI Service is operational');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('openai', true);
      expect(response.body.services).toHaveProperty('cognitive', true);
      expect(response.body.services).toHaveProperty('metrics', true);
    });
  });

  describe('POST /api/azure (Multimodal)', () => {
    it('should handle chat service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'chat',
          query: 'Hello, Azure!',
          options: {
            model: 'OX5C9E2B',
            temperature: 0.7,
          },
        })
        .expect(500); // Will fail without real Azure connection, but tests routing

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Azure service error');
    });

    it('should handle vision service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'vision',
          input: 'base64_image_data',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('service', 'vision');
      expect(response.body.result).toHaveProperty('service', 'Azure Computer Vision 2025');
      expect(response.body.result.analysis).toHaveProperty('tags');
      expect(response.body.result.analysis).toHaveProperty('objects');
    });

    it('should handle speech service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'speech',
          input: 'audio_data',
          options: {
            action: 'transcribe',
            language: 'tr-TR',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('service', 'Azure Speech-to-Text Neural');
      expect(response.body.result).toHaveProperty('text');
      expect(response.body.result).toHaveProperty('confidence');
    });

    it('should handle translation service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'translation',
          input: 'Merhaba dünya',
          options: {
            targetLanguage: 'en',
            sourceLanguage: 'auto',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('service', 'Azure Translator Neural');
      expect(response.body.result).toHaveProperty('translatedText');
      expect(response.body.result).toHaveProperty('confidence');
    });

    it('should handle health insights service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'health',
          input: 'medical_text_data',
          options: {
            action: 'analyze',
            inferenceTypes: ['finding', 'followup'],
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty(
        'service',
        'Azure Health Insights Radiology 2024-10-01'
      );
      expect(response.body.result).toHaveProperty('findings');
      expect(response.body.result).toHaveProperty('recommendations');
    });

    it('should handle quantum simulation service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'quantum',
          input: 'quantum_circuit',
          options: {
            qubits: 4,
            algorithm: 'grover',
            iterations: 100,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('service', 'Azure Quantum Simulation');
      expect(response.body.result).toHaveProperty('algorithm', 'grover');
      expect(response.body.result).toHaveProperty('qubits', 4);
      expect(response.body.result.result).toHaveProperty('quantumState');
    });

    it('should handle search service', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'search',
          query: 'Azure AI documentation',
          options: {
            top: 10,
            semanticConfig: 'default',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.result).toHaveProperty('service', 'Azure AI Search 2024');
      expect(response.body.result).toHaveProperty('results');
      expect(response.body.result.results).toHaveLength(2);
    });

    it('should reject request without service type', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          query: 'test query',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Service type required');
    });

    it('should reject unknown service type', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({
          service: 'unknown-service',
          query: 'test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Unknown service');
    });
  });

  describe('POST /api/azure/speech/live', () => {
    it('should handle live speech request', async () => {
      const response = await request(app)
        .post('/api/azure/speech/live')
        .send({
          language: 'tr-TR',
          action: 'transcribe',
          input: 'audio_data',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty(
        'service',
        'Azure Speech Services Live Language Support'
      );
      expect(response.body).toHaveProperty('language', 'tr-TR');
      expect(response.body.result).toHaveProperty('text');
      expect(response.body.result).toHaveProperty('confidence');
      expect(response.body.result).toHaveProperty('alternatives');
    });

    it('should use default language when not specified', async () => {
      const response = await request(app)
        .post('/api/azure/speech/live')
        .send({
          action: 'transcribe',
          input: 'audio_data',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('language', 'tr-TR');
    });
  });

  describe('POST /api/azure/search', () => {
    it('should handle search request', async () => {
      const response = await request(app)
        .post('/api/azure/search')
        .send({
          query: 'Azure OpenAI',
          top: 5,
          semanticConfig: 'default',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('service', 'Azure AI Search + RAG Pipeline');
      expect(response.body).toHaveProperty('query', 'Azure OpenAI');
      expect(response.body).toHaveProperty('results');
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('totalResults');
      expect(response.body).toHaveProperty('facets');
      expect(response.body).toHaveProperty('semanticAnswers');
    });

    it('should reject search without query', async () => {
      const response = await request(app)
        .post('/api/azure/search')
        .send({
          top: 10,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Search query required');
    });
  });

  describe('POST /api/azure/quantum', () => {
    it('should handle quantum request', async () => {
      const response = await request(app)
        .post('/api/azure/quantum')
        .send({
          algorithm: 'grover',
          qubits: 4,
          iterations: 100,
          input: 'quantum_circuit',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('service', 'Azure Quantum Computing Service');
      expect(response.body).toHaveProperty('status', 'completed');
      expect(response.body).toHaveProperty('algorithm', 'grover');
      expect(response.body).toHaveProperty('qubits', 4);
      expect(response.body.result).toHaveProperty('optimalSolution');
      expect(response.body.result).toHaveProperty('quantumAdvantage', true);
      expect(response.body.metadata).toHaveProperty('backend');
    });

    it('should use default quantum parameters', async () => {
      const response = await request(app).post('/api/azure/quantum').send({}).expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('algorithm', 'grover');
      expect(response.body).toHaveProperty('qubits', 4);
      expect(response.body).toHaveProperty('iterations', 100);
    });
  });

  describe('GET /api/azure/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/azure/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('openai');
      expect(response.body.services).toHaveProperty('cognitive');
      expect(response.body.services).toHaveProperty('metrics');
      expect(response.body.services.openai).toHaveProperty('enabled', true);
      expect(response.body.services.openai).toHaveProperty('status', 'operational');
    });
  });

  describe('GET /api/azure/metrics', () => {
    it('should return Azure metrics', async () => {
      const response = await request(app).get('/api/azure/metrics').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('systemHealth');
      // Azure metrics returns real-time infrastructure data
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/azure/unknown-endpoint').expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/azure/unknown-endpoint');
    });
  });

  describe('Service Management', () => {
    it('should start and stop service', async () => {
      const testService = new AzureAIService({
        port: 0,
        azureOpenAIEndpoint: 'https://test.openai.azure.com',
        azureOpenAIApiKey: 'test-key',
        enableMetrics: false,
      });

      const server = await testService.start();
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);

      await testService.stop();
      expect(server.listening).toBe(false);
    });

    it('should provide access to Express app', () => {
      const testService = new AzureAIService({
        azureOpenAIEndpoint: 'https://test.openai.azure.com',
        azureOpenAIApiKey: 'test-key',
        enableMetrics: false,
      });

      const app = testService.getApp();
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    it('should disable OpenAI when endpoint not configured', async () => {
      const testService = new AzureAIService({
        port: 0,
        azureOpenAIEndpoint: null, // No endpoint
        enableOpenAI: true,
      });

      const testApp = testService.getApp();
      const response = await request(testApp).get('/').expect(200);

      expect(response.body.endpoints.openai).toBe('disabled');
    });

    it('should work without Azure subscription ID (uses mock data)', async () => {
      const testService = new AzureAIService({
        port: 0,
        azureSubscriptionId: null, // No subscription
        enableMetrics: true,
      });

      const testApp = testService.getApp();
      const response = await request(testApp).get('/api/azure/metrics').expect(200);

      expect(response.body).toHaveProperty('success', true);
      // Should return mock data when no subscription configured
    });
  });
});

describe('Azure AI Service with Disabled Features', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with all features disabled
    service = new AzureAIService({
      port: 0,
      enableOpenAI: false,
      enableCognitiveServices: false,
      enableMetrics: false,
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Service with Disabled Features', () => {
    it('should show all features as disabled', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body.endpoints.openai).toBe('disabled');
      expect(response.body.endpoints.cognitive).toBe('disabled');
      expect(response.body.endpoints.metrics).toBe('disabled');
    });

    it('should not have OpenAI routes', async () => {
      const response = await request(app)
        .post('/api/azure')
        .send({ service: 'chat', query: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not have cognitive services routes', async () => {
      const response = await request(app)
        .post('/api/azure/speech/live')
        .send({ input: 'test' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not have metrics routes', async () => {
      const response = await request(app).get('/api/azure/metrics').expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
