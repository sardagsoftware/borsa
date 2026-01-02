/**
 * 🏗️ MICROSERVICES INTEGRATION TESTS
 *
 * Comprehensive integration tests for all 6 microservices
 * Tests service discovery, global health check, and cross-service functionality
 *
 * @since Phase 4 - Main Server Integration
 * @created 2026-01-02
 */

const request = require('supertest');
const express = require('express');
const { setupMicroservices } = require('../../middleware/microservices-integration');

describe('Microservices Integration', () => {
  let app;

  beforeAll(async () => {
    // Create Express app
    app = express();
    app.use(express.json());

    // Setup all microservices in integrated mode
    await setupMicroservices(app, { standalone: false });
  });

  describe('Service Discovery', () => {
    it('should return all available services', async () => {
      const response = await request(app).get('/api/services').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.totalServices).toBe(6);
      expect(response.body.services).toHaveLength(6);

      // Verify all services are present
      const serviceNames = response.body.services.map(s => s.name);
      expect(serviceNames).toContain('Monitoring Service');
      expect(serviceNames).toContain('Auth Service');
      expect(serviceNames).toContain('Azure AI Service');
      expect(serviceNames).toContain('AI Chat Service');
      expect(serviceNames).toContain('File Storage Service');
      expect(serviceNames).toContain('Payment Service');
    });

    it('should include service paths and endpoints', async () => {
      const response = await request(app).get('/api/services').expect(200);

      const monitoringService = response.body.services.find(s => s.name === 'Monitoring Service');
      expect(monitoringService).toBeDefined();
      expect(monitoringService.path).toBe('/api/monitoring');
      expect(monitoringService.port).toBe(3101);
      expect(monitoringService.endpoints).toBeDefined();
      expect(Array.isArray(monitoringService.endpoints)).toBe(true);
    });
  });

  describe('Global Health Check', () => {
    it('should return aggregate health status for all services', async () => {
      const response = await request(app).get('/api/services/health').expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('services');

      // Verify all services have health status
      expect(response.body.services).toHaveProperty('monitoring');
      expect(response.body.services).toHaveProperty('auth');
      expect(response.body.services).toHaveProperty('azureAI');
      expect(response.body.services).toHaveProperty('aiChat');
      expect(response.body.services).toHaveProperty('fileStorage');
      expect(response.body.services).toHaveProperty('payment');
    });

    it('should show OK status when all services are healthy', async () => {
      const response = await request(app).get('/api/services/health').expect(200);

      expect(response.body.overall).toBe('OK');

      // All individual services should be OK
      Object.keys(response.body.services).forEach(serviceName => {
        // eslint-disable-next-line security/detect-object-injection
        expect(response.body.services[serviceName].status).toBe('OK');
      });
    });
  });

  describe('Individual Service Access', () => {
    it('should access Monitoring Service', async () => {
      const response = await request(app).get('/api/monitoring/').expect(200);
      expect(response.body).toHaveProperty('service', 'monitoring-service');
    });

    it('should access Auth Service', async () => {
      const response = await request(app).get('/api/auth/').expect(200);
      expect(response.body).toHaveProperty('service', 'auth-service');
    });

    it('should access Azure AI Service', async () => {
      const response = await request(app).get('/api/azure-ai/').expect(200);
      expect(response.body).toHaveProperty('service', 'azure-ai-service');
    });

    it('should access AI Chat Service', async () => {
      const response = await request(app).get('/api/ai-chat/').expect(200);
      expect(response.body).toHaveProperty('service', 'ai-chat-service');
    });

    it('should access File Storage Service', async () => {
      const response = await request(app).get('/api/files/').expect(200);
      expect(response.body).toHaveProperty('service', 'file-storage-service');
    });

    it('should access Payment Service', async () => {
      const response = await request(app).get('/api/payments/').expect(200);
      expect(response.body).toHaveProperty('service', 'payment-service');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown service paths', async () => {
      await request(app).get('/api/unknown-service').expect(404);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests to all services', async () => {
      const requests = [
        request(app).get('/api/monitoring/'),
        request(app).get('/api/auth/'),
        request(app).get('/api/azure-ai/'),
        request(app).get('/api/ai-chat/'),
        request(app).get('/api/files/'),
        request(app).get('/api/payments/'),
      ];

      const responses = await Promise.all(requests);

      // All requests should succeed (200 or 304 for caching)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should respond quickly to health checks', async () => {
      const startTime = Date.now();

      await request(app).get('/api/services/health').expect(200);

      const responseTime = Date.now() - startTime;

      // Health check should respond in less than 1 second
      expect(responseTime).toBeLessThan(1000);
    });
  });
});

describe('Microservices Integration - Standalone Mode', () => {
  it('should initialize services in standalone mode', () => {
    const { initializeMicroservices } = require('../../middleware/microservices-integration');

    const services = initializeMicroservices({ standalone: true });

    expect(services).toHaveProperty('monitoring');
    expect(services).toHaveProperty('auth');
    expect(services).toHaveProperty('azureAI');
    expect(services).toHaveProperty('aiChat');
    expect(services).toHaveProperty('fileStorage');
    expect(services).toHaveProperty('payment');

    // All services should be initialized
    Object.values(services).forEach(service => {
      expect(service).not.toBeNull();
    });
  });
});
