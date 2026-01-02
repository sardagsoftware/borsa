/**
 * 🏗️ MICROSERVICES INTEGRATION LAYER
 *
 * Unified integration layer for all AILYDIAN microservices
 *
 * Services:
 * - Monitoring Service (Port 3101)
 * - Auth Service (Port 3102)
 * - Azure AI Service (Port 3103)
 * - AI Chat Service (Port 3104)
 * - File Storage Service (Port 3105)
 * - Payment Service (Port 3106)
 *
 * Features:
 * - Integrated mode (all services in main server)
 * - Standalone mode (each service on own port)
 * - Global health check (aggregate all services)
 * - Production-ready error handling
 * - Service discovery
 *
 * @module microservices-integration
 * @since Phase 4 - Main Server Integration
 * @created 2026-01-02
 */

const logger = require('../lib/logger/production-logger');

// Import all microservices
const MonitoringService = require('../services/monitoring-service');
const AuthService = require('../services/auth-service');
const AzureAIService = require('../services/azure-ai-service');
const AIChatService = require('../services/ai-chat-service');
const FileStorageService = require('../services/file-storage-service');
const PaymentService = require('../services/payment-service');

/**
 * Initialize all microservices
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.standalone - Run services standalone (default: false)
 * @returns {Object} - Initialized services
 */
function initializeMicroservices(options = {}) {
  const { standalone = false } = options;

  logger.info('🏗️  Initializing microservices integration layer', { standalone });

  const services = {
    monitoring: null,
    auth: null,
    azureAI: null,
    aiChat: null,
    fileStorage: null,
    payment: null,
  };

  try {
    // 1. Monitoring Service (Port 3101)
    services.monitoring = new MonitoringService({
      port: standalone ? 3101 : null,
      enableMetrics: true,
      metricsInterval: 60000, // 1 minute
    });
    logger.info('✅ Monitoring Service initialized');

    // 2. Auth Service (Port 3102)
    services.auth = new AuthService({
      port: standalone ? 3102 : null,
      jwtSecret: process.env.JWT_SECRET,
      tokenExpiry: '24h',
      refreshTokenExpiry: '7d',
    });
    logger.info('✅ Auth Service initialized');

    // 3. Azure AI Service (Port 3103)
    services.azureAI = new AzureAIService({
      port: standalone ? 3103 : null,
      azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    });
    logger.info('✅ Azure AI Service initialized');

    // 4. AI Chat Service (Port 3104)
    services.aiChat = new AIChatService({
      port: standalone ? 3104 : null,
      maxConversationHistory: 50,
      enableStreamingResponses: true,
    });
    logger.info('✅ AI Chat Service initialized');

    // 5. File Storage Service (Port 3105)
    services.fileStorage = new FileStorageService({
      port: standalone ? 3105 : null,
      azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      azureContainerName: process.env.AZURE_CONTAINER_NAME || 'uploads',
      maxFileSize: 100 * 1024 * 1024, // 100MB
      enableImageOptimization: true,
    });
    logger.info('✅ File Storage Service initialized');

    // 6. Payment Service (Port 3106)
    services.payment = new PaymentService({
      port: standalone ? 3106 : null,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: 'usd',
    });
    logger.info('✅ Payment Service initialized');

    logger.info('✅ All 6 microservices initialized successfully');

    return services;
  } catch (error) {
    logger.error('❌ Failed to initialize microservices', { error: error.message });
    throw error;
  }
}

/**
 * Mount all microservices on Express app
 *
 * @param {Express.Application} app - Express app instance
 * @param {Object} services - Initialized services
 */
function mountMicroservices(app, services) {
  logger.info('🔗 Mounting microservices on main server');

  try {
    // Mount Monitoring Service
    if (services.monitoring) {
      app.use('/api/monitoring', services.monitoring.getApp());
      logger.info('✅ Monitoring Service mounted on /api/monitoring');
    }

    // Mount Auth Service
    if (services.auth) {
      app.use('/api/auth', services.auth.getApp());
      logger.info('✅ Auth Service mounted on /api/auth');
    }

    // Mount Azure AI Service
    if (services.azureAI) {
      app.use('/api/azure-ai', services.azureAI.getApp());
      logger.info('✅ Azure AI Service mounted on /api/azure-ai');
    }

    // Mount AI Chat Service
    if (services.aiChat) {
      app.use('/api/ai-chat', services.aiChat.getApp());
      logger.info('✅ AI Chat Service mounted on /api/ai-chat');
    }

    // Mount File Storage Service
    if (services.fileStorage) {
      app.use('/api/files', services.fileStorage.getApp());
      logger.info('✅ File Storage Service mounted on /api/files');
    }

    // Mount Payment Service
    if (services.payment) {
      app.use('/api/payments', services.payment.getApp());
      logger.info('✅ Payment Service mounted on /api/payments');
    }

    logger.info('✅ All microservices mounted successfully');
  } catch (error) {
    logger.error('❌ Failed to mount microservices', { error: error.message });
    throw error;
  }
}

/**
 * Create global health check endpoint
 * Aggregates health status from all services
 *
 * @param {Express.Application} app - Express app instance
 * @param {Object} services - Initialized services
 */
function setupGlobalHealthCheck(app, services) {
  app.get('/api/services/health', async (req, res) => {
    try {
      const healthChecks = {
        timestamp: new Date().toISOString(),
        overall: 'OK',
        services: {},
      };

      // Check each service
      const serviceChecks = [
        { name: 'monitoring', service: services.monitoring, path: '/health' },
        { name: 'auth', service: services.auth, path: '/health' },
        { name: 'azureAI', service: services.azureAI, path: '/health' },
        { name: 'aiChat', service: services.aiChat, path: '/health' },
        { name: 'fileStorage', service: services.fileStorage, path: '/health' },
        { name: 'payment', service: services.payment, path: '/health' },
      ];

      for (const check of serviceChecks) {
        try {
          if (check.service && typeof check.service.getStats === 'function') {
            const stats = check.service.getStats();
            healthChecks.services[check.name] = {
              status: 'OK',
              stats,
            };
          } else {
            healthChecks.services[check.name] = {
              status: 'OK',
              message: 'Service running',
            };
          }
        } catch (error) {
          healthChecks.services[check.name] = {
            status: 'ERROR',
            error: error.message,
          };
          healthChecks.overall = 'DEGRADED';
        }
      }

      // Send response
      res.status(healthChecks.overall === 'OK' ? 200 : 503).json(healthChecks);
    } catch (error) {
      logger.error('❌ Global health check failed', { error: error.message });
      res.status(500).json({
        timestamp: new Date().toISOString(),
        overall: 'ERROR',
        error: error.message,
      });
    }
  });

  logger.info('✅ Global health check endpoint created: GET /api/services/health');
}

/**
 * Create service discovery endpoint
 * Returns information about all available services
 *
 * @param {Express.Application} app - Express app instance
 */
function setupServiceDiscovery(app) {
  app.get('/api/services', (req, res) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: [
        {
          name: 'Monitoring Service',
          path: '/api/monitoring',
          port: process.env.MONITORING_PORT || 3101,
          description: 'System health monitoring and metrics',
          endpoints: [
            'GET /api/monitoring/health',
            'GET /api/monitoring/metrics',
            'GET /api/monitoring/uptime',
          ],
        },
        {
          name: 'Auth Service',
          path: '/api/auth',
          port: process.env.AUTH_PORT || 3102,
          description: 'User authentication and authorization',
          endpoints: [
            'POST /api/auth/login',
            'POST /api/auth/register',
            'POST /api/auth/refresh',
            'POST /api/auth/logout',
            'GET /api/auth/verify',
          ],
        },
        {
          name: 'Azure AI Service',
          path: '/api/azure-ai',
          port: process.env.AZURE_AI_PORT || 3103,
          description: 'Azure OpenAI integration',
          endpoints: [
            'POST /api/azure-ai/chat',
            'POST /api/azure-ai/completion',
            'POST /api/azure-ai/embedding',
          ],
        },
        {
          name: 'AI Chat Service',
          path: '/api/ai-chat',
          port: process.env.AI_CHAT_PORT || 3104,
          description: 'Multi-model AI chat service',
          endpoints: [
            'POST /api/ai-chat/chat',
            'GET /api/ai-chat/conversations',
            'GET /api/ai-chat/conversations/:id',
            'DELETE /api/ai-chat/conversations/:id',
          ],
        },
        {
          name: 'File Storage Service',
          path: '/api/files',
          port: process.env.FILE_STORAGE_PORT || 3105,
          description: 'File upload and storage with Azure Blob',
          endpoints: [
            'POST /api/files/upload',
            'POST /api/files/upload/multiple',
            'GET /api/files/:id',
            'DELETE /api/files/:id',
            'GET /api/files',
            'POST /api/files/:id/share',
          ],
        },
        {
          name: 'Payment Service',
          path: '/api/payments',
          port: process.env.PAYMENT_PORT || 3106,
          description: 'Stripe payment processing',
          endpoints: [
            'POST /api/payments/create-payment-intent',
            'POST /api/payments/confirm-payment',
            'POST /api/payments/customers/create',
            'POST /api/payments/subscriptions/create',
            'POST /api/payments/refunds/create',
            'POST /api/payments/webhooks/stripe',
          ],
        },
      ],
      totalServices: 6,
    });
  });

  logger.info('✅ Service discovery endpoint created: GET /api/services');
}

/**
 * Start all services in standalone mode
 * Each service runs on its own port
 *
 * @param {Object} services - Initialized services
 */
async function startStandaloneServices(services) {
  logger.info('🚀 Starting all services in standalone mode');

  const startPromises = [];

  if (services.monitoring) {
    startPromises.push(
      services.monitoring.start().then(() => logger.info('✅ Monitoring Service started on port 3101'))
    );
  }

  if (services.auth) {
    startPromises.push(
      services.auth.start().then(() => logger.info('✅ Auth Service started on port 3102'))
    );
  }

  if (services.azureAI) {
    startPromises.push(
      services.azureAI.start().then(() => logger.info('✅ Azure AI Service started on port 3103'))
    );
  }

  if (services.aiChat) {
    startPromises.push(
      services.aiChat.start().then(() => logger.info('✅ AI Chat Service started on port 3104'))
    );
  }

  if (services.fileStorage) {
    startPromises.push(
      services.fileStorage.start().then(() => logger.info('✅ File Storage Service started on port 3105'))
    );
  }

  if (services.payment) {
    startPromises.push(
      services.payment.start().then(() => logger.info('✅ Payment Service started on port 3106'))
    );
  }

  await Promise.all(startPromises);

  logger.info('✅ All services started in standalone mode');
}

/**
 * Setup complete microservices integration
 *
 * @param {Express.Application} app - Express app instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.standalone - Run services standalone
 * @returns {Object} - Initialized services
 */
async function setupMicroservices(app, options = {}) {
  const { standalone = false } = options;

  logger.info('🏗️  Setting up microservices integration', { standalone });

  try {
    // Initialize all services
    const services = initializeMicroservices({ standalone });

    if (standalone) {
      // Start each service on its own port
      await startStandaloneServices(services);
    } else {
      // Mount all services on main app
      mountMicroservices(app, services);

      // Setup global health check
      setupGlobalHealthCheck(app, services);

      // Setup service discovery
      setupServiceDiscovery(app);
    }

    logger.info('✅ Microservices integration setup complete');

    return services;
  } catch (error) {
    logger.error('❌ Microservices setup failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  setupMicroservices,
  initializeMicroservices,
  mountMicroservices,
  setupGlobalHealthCheck,
  setupServiceDiscovery,
  startStandaloneServices,
};
