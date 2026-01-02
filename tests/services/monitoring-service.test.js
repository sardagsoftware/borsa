/**
 * Monitoring Service Tests
 * Tests for the extracted monitoring microservice
 */

const request = require('supertest');
const MonitoringService = require('../../services/monitoring-service');

describe('Monitoring Service', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with test configuration
    service = new MonitoringService({
      port: 0, // Random port for testing
      enableSentry: false, // Disable Sentry in tests
      enableHealthMonitor: false // Disable health monitor for faster tests
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('GET /api/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'monitoring-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should have valid timestamp format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('GET /api/status', () => {
    it('should return detailed server status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'monitoring-service');
      expect(response.body).toHaveProperty('status', 'ACTIVE');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('process');
    });

    it('should include memory metrics', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });

    it('should include process information', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body.process).toHaveProperty('pid');
      expect(response.body.process).toHaveProperty('nodeVersion');
      expect(response.body.process).toHaveProperty('platform');
      expect(response.body.process.pid).toBe(process.pid);
    });
  });

  describe('GET /api/database/health', () => {
    it('should return database health status', async () => {
      const response = await request(app)
        .get('/api/database/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('connections');
      expect(typeof response.body.responseTime).toBe('number');
      expect(typeof response.body.connections).toBe('number');
    });
  });

  describe('GET /api/cache/health', () => {
    it('should return cache health status', async () => {
      const response = await request(app)
        .get('/api/cache/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('hitRatio');
      expect(typeof response.body.responseTime).toBe('number');
      expect(typeof response.body.hitRatio).toBe('number');
      expect(response.body.hitRatio).toBeGreaterThanOrEqual(0);
      expect(response.body.hitRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/storage/health', () => {
    it('should return storage health status', async () => {
      const response = await request(app)
        .get('/api/storage/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('usage');
      expect(typeof response.body.responseTime).toBe('number');
      expect(typeof response.body.usage).toBe('number');
      expect(response.body.usage).toBeGreaterThanOrEqual(0);
      expect(response.body.usage).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/alerts/webhook', () => {
    it('should accept valid alert and return success', async () => {
      const alertData = {
        alertType: 'system',
        severity: 'info',
        message: 'Test alert',
        metadata: { source: 'test' }
      };

      const response = await request(app)
        .post('/api/alerts/webhook')
        .send(alertData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('alert');
      expect(response.body.alert).toHaveProperty('id');
      expect(response.body.alert).toHaveProperty('type', 'system');
      expect(response.body.alert).toHaveProperty('severity', 'info');
      expect(response.body.alert).toHaveProperty('message', 'Test alert');
      expect(response.body.alert).toHaveProperty('acknowledged', false);
    });

    it('should handle critical alerts with escalation', async () => {
      const alertData = {
        alertType: 'database',
        severity: 'critical',
        message: 'Database connection lost',
        metadata: { database: 'postgres-primary' }
      };

      const response = await request(app)
        .post('/api/alerts/webhook')
        .send(alertData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.alert).toHaveProperty('severity', 'critical');
      expect(response.body.alert).toHaveProperty('escalation');
      expect(response.body.alert.escalation).toHaveProperty('pagerDuty', 'triggered');
      expect(response.body.alert.escalation).toHaveProperty('sms', 'sent');
      expect(response.body.alert.escalation).toHaveProperty('email', 'sent');
      expect(response.body.alert.escalation).toHaveProperty('slackChannel', '#alerts-critical');
    });

    it('should reject alert without required fields', async () => {
      const response = await request(app)
        .post('/api/alerts/webhook')
        .send({
          alertType: 'system'
          // Missing severity and message
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required fields');
    });

    it('should generate unique alert IDs', async () => {
      const alertData = {
        alertType: 'test',
        severity: 'info',
        message: 'Alert 1'
      };

      const response1 = await request(app)
        .post('/api/alerts/webhook')
        .send(alertData);

      const response2 = await request(app)
        .post('/api/alerts/webhook')
        .send({ ...alertData, message: 'Alert 2' });

      expect(response1.body.alert.id).not.toBe(response2.body.alert.id);
    });

    it('should include processing information', async () => {
      const alertData = {
        alertType: 'monitoring',
        severity: 'warning',
        message: 'High CPU usage detected'
      };

      const response = await request(app)
        .post('/api/alerts/webhook')
        .send(alertData)
        .expect(200);

      expect(response.body).toHaveProperty('processing');
      expect(response.body.processing).toHaveProperty('queued', true);
      expect(response.body.processing).toHaveProperty('estimatedDelivery');
      expect(response.body.processing).toHaveProperty('channels');
      expect(Array.isArray(response.body.processing.channels)).toBe(true);
    });
  });

  describe('GET /', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'monitoring-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should list all available endpoints', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.endpoints).toHaveProperty('health');
      expect(response.body.endpoints).toHaveProperty('alerts');
      expect(response.body.endpoints.health).toHaveProperty('basic');
      expect(response.body.endpoints.health).toHaveProperty('status');
      expect(response.body.endpoints.alerts).toHaveProperty('webhook');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/unknown-endpoint');
    });

    it('should handle POST to GET-only endpoints', async () => {
      const response = await request(app)
        .post('/api/health')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Service Management', () => {
    it('should start and stop service', async () => {
      const testService = new MonitoringService({
        port: 0,
        enableSentry: false,
        enableHealthMonitor: false
      });

      const server = await testService.start();
      expect(server).toBeDefined();
      expect(server.listening).toBe(true);

      await testService.stop();
      expect(server.listening).toBe(false);
    });

    it('should provide access to Express app', () => {
      const testService = new MonitoringService({
        enableSentry: false,
        enableHealthMonitor: false
      });

      const app = testService.getApp();
      expect(app).toBeDefined();
      expect(typeof app.use).toBe('function');
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
    });
  });
});

describe('Monitoring Service with Health Monitor', () => {
  let service;
  let app;

  beforeAll(async () => {
    service = new MonitoringService({
      port: 0,
      enableSentry: false,
      enableHealthMonitor: true // Enable health monitor for these tests
    });
    app = service.getApp();

    // Give health monitor time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('GET /api/health-status', () => {
    it('should return API health monitor status', async () => {
      const response = await request(app)
        .get('/api/health-status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('GET /api/health-monitor', () => {
    it('should return detailed monitoring data', async () => {
      const response = await request(app)
        .get('/api/health-monitor')
        .expect(200);

      expect(response.body).toHaveProperty('health');
      expect(response.body).toHaveProperty('websockets');
      expect(response.body).toHaveProperty('monitoring');
    });
  });

  describe('Health Monitor Instance', () => {
    it('should provide access to health monitor', () => {
      const healthMonitor = service.getHealthMonitor();
      expect(healthMonitor).toBeDefined();
      expect(typeof healthMonitor.getFullStatus).toBe('function');
    });
  });
});
