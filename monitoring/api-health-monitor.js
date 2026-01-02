/**
 * 🔍 API HEALTH & WEBSOCKET STATUS MONITORING SYSTEM
 * Real-time monitoring of API endpoints and WebSocket connections
 * Enterprise-grade health checking and status reporting
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class APIHealthMonitor extends EventEmitter {
  constructor() {
    super();
    this.healthStatus = new Map();
    this.websocketStatus = new Map();
    this.apiEndpoints = {
      // Core AI APIs
      'lydian-labs': 'https://api.openai.com/v1/models',
      'azure-openai':
        process.env.AZURE_OPENAI_ENDPOINT || 'https://ailydian-openai.openai.azure.com/',
      'google-ai': 'https://generativelanguage.googleapis.com/v1/models',
      'z-ai': 'https://api.z.ai/v1/health',
      AX9F7E2B: 'https://api.anthropic.com/v1/messages',

      // Local Services
      'chat-service': 'http://localhost:3100/api/health',
      'ai-assistant': 'http://localhost:3100/api/ai-assistant/health',
      websocket: 'ws://localhost:3100',

      // External Services
      'microsoft-graph': 'https://graph.microsoft.com/v1.0/$metadata',
      'azure-cognitive':
        process.env.AZURE_COGNITIVE_ENDPOINT || 'https://westeurope.api.cognitive.microsoft.com/',
      'google-cloud': 'https://cloud.google.com/_ah/health',

      // Database & Infrastructure
      database: 'http://localhost:3100/api/database/health',
      'redis-cache': 'http://localhost:3100/api/cache/health',
      'file-storage': 'http://localhost:3100/api/storage/health',
    };

    this.websocketEndpoints = {
      'chat-websocket': 'ws://localhost:3100',
      'ai-stream': 'ws://localhost:3100/ai-stream',
      'voice-stream': 'ws://localhost:3100/voice-stream',
      'file-upload': 'ws://localhost:3100/file-upload',
    };

    this.healthCheckInterval = 30000; // 30 seconds
    this.websocketCheckInterval = 15000; // 15 seconds
    this.timeout = 10000; // 10 seconds timeout
    this.healthCheckIntervalId = null;
    this.websocketCheckIntervalId = null;
    this.isTestMode = process.env.NODE_ENV === 'test';

    if (!this.isTestMode) {
      this.init();
    }
  }

  async init() {
    console.log('🔍 Initializing API Health Monitor...');

    // Initialize all endpoints as unknown
    for (const [name] of Object.entries(this.apiEndpoints)) {
      this.healthStatus.set(name, {
        status: 'unknown',
        lastCheck: null,
        responseTime: null,
        error: null,
        uptime: 0,
        lastSuccessTime: null,
      });
    }

    for (const [name] of Object.entries(this.websocketEndpoints)) {
      this.websocketStatus.set(name, {
        status: 'unknown',
        lastCheck: null,
        connectionTime: null,
        error: null,
        uptime: 0,
        lastSuccessTime: null,
      });
    }

    // Start monitoring
    this.startHealthChecks();
    this.startWebSocketChecks();

    console.log('✅ API Health Monitor initialized');
  }

  startHealthChecks() {
    // Initial check
    this.performHealthChecks();

    // Schedule periodic checks
    this.healthCheckIntervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);

    console.log('🔄 Health checks started');
  }

  async performHealthChecks() {
    const checkPromises = Object.entries(this.apiEndpoints).map(([name, endpoint]) =>
      this.checkAPIHealth(name, endpoint)
    );

    await Promise.allSettled(checkPromises);
    this.emit('healthUpdate', this.getHealthSummary());
  }

  async checkAPIHealth(name, endpoint) {
    const startTime = Date.now();
    const currentStatus = this.healthStatus.get(name);

    try {
      let response;

      // Special handling for different API types
      switch (name) {
        case 'lydian-labs':
          response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY || 'test-key'}`,
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          });
          break;

        case 'azure-openai':
          response = await axios.get(`${endpoint}openai/deployments?api-version=2024-02-01`, {
            headers: {
              'api-key': process.env.AZURE_OPENAI_API_KEY || 'test-key',
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          });
          break;

        case 'google-ai':
          response = await axios.get(endpoint, {
            params: {
              key: process.env.GOOGLE_AI_KEY || 'test-key',
            },
            timeout: this.timeout,
          });
          break;

        case 'AX9F7E2B':
          // For AX9F7E2B, we'll just check if the endpoint responds
          response = await axios.options(endpoint, {
            headers: {
              'x-api-key': process.env.AX9F7E2B_API_KEY || 'test-key',
              'Content-Type': 'application/json',
            },
            timeout: this.timeout,
          });
          break;

        default:
          response = await axios.get(endpoint, {
            timeout: this.timeout,
            validateStatus: function (status) {
              return status < 500; // Accept 2xx, 3xx, 4xx as valid responses
            },
          });
      }

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 400;

      this.healthStatus.set(name, {
        status: isHealthy ? 'healthy' : 'degraded',
        lastCheck: new Date().toISOString(),
        responseTime,
        error: null,
        uptime: isHealthy ? currentStatus.uptime + 1 : currentStatus.uptime,
        lastSuccessTime: isHealthy ? new Date().toISOString() : currentStatus.lastSuccessTime,
      });

      if (isHealthy) {
        console.log(`✅ ${name}: Healthy (${responseTime}ms)`);
      } else {
        console.log(`⚠️ ${name}: Degraded - Status ${response.status} (${responseTime}ms)`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.healthStatus.set(name, {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime,
        error: error.message,
        uptime: currentStatus.uptime,
        lastSuccessTime: currentStatus.lastSuccessTime,
      });

      console.log(`❌ ${name}: Unhealthy - ${error.message} (${responseTime}ms)`);
    }
  }

  startWebSocketChecks() {
    // Initial check
    this.performWebSocketChecks();

    // Schedule periodic checks
    this.websocketCheckIntervalId = setInterval(() => {
      this.performWebSocketChecks();
    }, this.websocketCheckInterval);

    console.log('🔄 WebSocket checks started');
  }

  async performWebSocketChecks() {
    const checkPromises = Object.entries(this.websocketEndpoints).map(([name, endpoint]) =>
      this.checkWebSocketHealth(name, endpoint)
    );

    await Promise.allSettled(checkPromises);
    this.emit('websocketUpdate', this.getWebSocketSummary());
  }

  async checkWebSocketHealth(name, endpoint) {
    const startTime = Date.now();
    const currentStatus = this.websocketStatus.get(name);

    return new Promise(resolve => {
      try {
        const ws = new WebSocket(endpoint);
        const timeout = setTimeout(() => {
          ws.terminate();
          this.updateWebSocketStatus(
            name,
            'unhealthy',
            Date.now() - startTime,
            'Connection timeout',
            currentStatus
          );
          resolve();
        }, this.timeout);

        ws.on('open', () => {
          clearTimeout(timeout);
          const connectionTime = Date.now() - startTime;

          this.updateWebSocketStatus(name, 'healthy', connectionTime, null, currentStatus, true);
          console.log(`✅ WebSocket ${name}: Connected (${connectionTime}ms)`);

          ws.close();
          resolve();
        });

        ws.on('error', error => {
          clearTimeout(timeout);
          const connectionTime = Date.now() - startTime;

          this.updateWebSocketStatus(
            name,
            'unhealthy',
            connectionTime,
            error.message,
            currentStatus
          );
          console.log(`❌ WebSocket ${name}: Error - ${error.message} (${connectionTime}ms)`);

          resolve();
        });
      } catch (error) {
        const connectionTime = Date.now() - startTime;
        this.updateWebSocketStatus(name, 'unhealthy', connectionTime, error.message, currentStatus);
        console.log(`❌ WebSocket ${name}: Exception - ${error.message} (${connectionTime}ms)`);
        resolve();
      }
    });
  }

  updateWebSocketStatus(name, status, connectionTime, error, currentStatus, isSuccess = false) {
    this.websocketStatus.set(name, {
      status,
      lastCheck: new Date().toISOString(),
      connectionTime,
      error,
      uptime: isSuccess ? currentStatus.uptime + 1 : currentStatus.uptime,
      lastSuccessTime: isSuccess ? new Date().toISOString() : currentStatus.lastSuccessTime,
    });
  }

  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {},
      stats: {
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        unknown: 0,
      },
    };

    for (const [name, status] of this.healthStatus.entries()) {
      summary.services[name] = status;
      summary.stats.total++;
      summary.stats[status.status]++;
    }

    // Determine overall health
    if (summary.stats.unhealthy > 0) {
      summary.overall = 'unhealthy';
    } else if (summary.stats.degraded > 0) {
      summary.overall = 'degraded';
    } else if (summary.stats.unknown > summary.stats.total / 2) {
      summary.overall = 'unknown';
    }

    return summary;
  }

  getWebSocketSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      connections: {},
      stats: {
        total: 0,
        healthy: 0,
        unhealthy: 0,
        unknown: 0,
      },
    };

    for (const [name, status] of this.websocketStatus.entries()) {
      summary.connections[name] = status;
      summary.stats.total++;
      summary.stats[status.status]++;
    }

    // Determine overall WebSocket health
    if (summary.stats.unhealthy > summary.stats.total / 2) {
      summary.overall = 'unhealthy';
    } else if (summary.stats.unknown > summary.stats.total / 2) {
      summary.overall = 'unknown';
    }

    return summary;
  }

  // Stop monitoring and clean up intervals
  stop() {
    console.log('🛑 Stopping API Health Monitor...');

    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
      console.log('✅ Health check interval cleared');
    }

    if (this.websocketCheckIntervalId) {
      clearInterval(this.websocketCheckIntervalId);
      this.websocketCheckIntervalId = null;
      console.log('✅ WebSocket check interval cleared');
    }

    console.log('✅ API Health Monitor stopped');
  }

  getFullStatus() {
    return {
      health: this.getHealthSummary(),
      websockets: this.getWebSocketSummary(),
      monitoring: {
        healthCheckInterval: this.healthCheckInterval,
        websocketCheckInterval: this.websocketCheckInterval,
        timeout: this.timeout,
        startTime: this.startTime || new Date().toISOString(),
      },
    };
  }

  // API endpoints for integration
  getStatusForAPI() {
    const health = this.getHealthSummary();
    const websockets = this.getWebSocketSummary();

    return {
      status:
        health.overall === 'healthy' && websockets.overall === 'healthy'
          ? 'operational'
          : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: health.overall,
          healthy: health.stats.healthy,
          total: health.stats.total,
        },
        websockets: {
          status: websockets.overall,
          healthy: websockets.stats.healthy,
          total: websockets.stats.total,
        },
      },
      details: {
        apis: health.services,
        websockets: websockets.connections,
      },
    };
  }
}

module.exports = APIHealthMonitor;
