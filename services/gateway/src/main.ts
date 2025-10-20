// ========================================
// LYDIAN GATEWAY API
// Main entry point - Fastify server
// White-Hat: Security headers, CORS, rate limiting
// ========================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { actionRegistry } from '@lydian/app-sdk';
import { TrendyolConnector, HepsiburadaConnector } from '@lydian/connectors-commerce';
import { GetirConnector, YemeksepetiConnector, TrendyolYemekConnector } from '@lydian/connectors-delivery';
import { registerRateLimitMiddleware } from './middleware/rate-limit';
import {
  executeActionHandler,
  listActionsHandler,
  healthCheckHandler,
} from './controllers/actions.controller';
import { healthzHandler } from './controllers/healthz.controller';
import { metricsHandler } from './controllers/metrics.controller';

const PORT = parseInt(process.env.PORT || '3100', 10);
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Bootstrap application
 */
async function bootstrap() {
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    },
    requestIdLogLabel: 'requestId',
  });

  // Register plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  await fastify.register(cors, {
    origin: [
      'https://www.ailydian.com',
      'https://ailydian.com',
      'http://localhost:3000',
      'http://localhost:3100',
    ],
    credentials: true,
  });

  await registerRateLimitMiddleware(fastify);

  // ========== Initialize Connectors ==========
  fastify.log.info('🔌 Initializing connectors...');

  // Trendyol Connector (Commerce)
  if (process.env.TRENDYOL_API_KEY) {
    try {
      const trendyol = new TrendyolConnector();
      await trendyol.initialize({
        TRENDYOL_API_KEY: process.env.TRENDYOL_API_KEY,
        TRENDYOL_API_SECRET: process.env.TRENDYOL_API_SECRET,
        TRENDYOL_SUPPLIER_ID: process.env.TRENDYOL_SUPPLIER_ID,
      });
      await actionRegistry.registerConnector(trendyol);
      fastify.log.info('✅ Trendyol connector registered');
    } catch (error: any) {
      fastify.log.error({ error }, '❌ Trendyol connector failed to initialize');
    }
  } else {
    fastify.log.warn('⚠️ Trendyol credentials not found - skipping');
  }

  // Hepsiburada Connector (Commerce)
  if (process.env.HEPSIBURADA_API_KEY) {
    try {
      const hepsiburada = new HepsiburadaConnector();
      await hepsiburada.initialize({
        HEPSIBURADA_API_KEY: process.env.HEPSIBURADA_API_KEY,
        HEPSIBURADA_API_SECRET: process.env.HEPSIBURADA_API_SECRET,
        HEPSIBURADA_MERCHANT_ID: process.env.HEPSIBURADA_MERCHANT_ID,
      });
      await actionRegistry.registerConnector(hepsiburada);
      fastify.log.info('✅ Hepsiburada connector registered');
    } catch (error: any) {
      fastify.log.error({ error }, '❌ Hepsiburada connector failed to initialize');
    }
  } else {
    fastify.log.warn('⚠️ Hepsiburada credentials not found - skipping');
  }

  // Getir Connector (Delivery - Partner Gated)
  if (process.env.GETIR_API_KEY) {
    try {
      const getir = new GetirConnector();
      await getir.initialize({
        GETIR_API_KEY: process.env.GETIR_API_KEY,
        GETIR_PARTNER_ID: process.env.GETIR_PARTNER_ID,
      });
      await actionRegistry.registerConnector(getir);
      fastify.log.info('✅ Getir connector registered');
    } catch (error: any) {
      fastify.log.error({ error }, '❌ Getir connector failed to initialize');
    }
  } else {
    fastify.log.warn('⚠️ Getir credentials not found - skipping');
  }

  // Yemeksepeti Connector (Delivery - Partner Gated)
  if (process.env.YEMEKSEPETI_API_KEY) {
    try {
      const yemeksepeti = new YemeksepetiConnector();
      await yemeksepeti.initialize({
        YEMEKSEPETI_API_KEY: process.env.YEMEKSEPETI_API_KEY,
        YEMEKSEPETI_RESTAURANT_KEY: process.env.YEMEKSEPETI_RESTAURANT_KEY,
      });
      await actionRegistry.registerConnector(yemeksepeti);
      fastify.log.info('✅ Yemeksepeti connector registered');
    } catch (error: any) {
      fastify.log.error({ error }, '❌ Yemeksepeti connector failed to initialize');
    }
  } else {
    fastify.log.warn('⚠️ Yemeksepeti credentials not found - skipping');
  }

  // Trendyol Yemek Connector (Delivery - Partner Gated)
  if (process.env.TRENDYOL_YEMEK_PARTNER_KEY) {
    try {
      const trendyolYemek = new TrendyolYemekConnector();
      await trendyolYemek.initialize({
        TRENDYOL_YEMEK_PARTNER_KEY: process.env.TRENDYOL_YEMEK_PARTNER_KEY,
        TRENDYOL_YEMEK_RESTAURANT_ID: process.env.TRENDYOL_YEMEK_RESTAURANT_ID,
      });
      await actionRegistry.registerConnector(trendyolYemek);
      fastify.log.info('✅ Trendyol Yemek connector registered');
    } catch (error: any) {
      fastify.log.error({ error }, '❌ Trendyol Yemek connector failed to initialize');
    }
  } else {
    fastify.log.warn('⚠️ Trendyol Yemek credentials not found - skipping');
  }

  // TODO: Register other connectors (Wolt, Bolt Food, regional delivery platforms)

  // ========== Register Routes ==========

  // SPRINT 0 - Observability endpoints
  fastify.get('/healthz', healthzHandler); // Kubernetes-style health check
  fastify.get('/metrics', metricsHandler); // Prometheus metrics

  // Legacy health check
  fastify.get('/api/health', healthCheckHandler);

  // Actions API
  fastify.get('/api/actions', listActionsHandler);
  fastify.post('/api/actions', executeActionHandler);

  // Root
  fastify.get('/', async (request, reply) => {
    return {
      service: 'Lydian Gateway API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        actions: {
          list: 'GET /api/actions',
          execute: 'POST /api/actions',
        },
      },
    };
  });

  // ========== Graceful Shutdown ==========
  const signals = ['SIGINT', 'SIGTERM'];

  for (const signal of signals) {
    process.on(signal, async () => {
      fastify.log.info(`${signal} received, shutting down gracefully...`);

      try {
        await actionRegistry.shutdown();
        await fastify.close();
        fastify.log.info('✅ Gateway shutdown complete');
        process.exit(0);
      } catch (error) {
        fastify.log.error({ error }, '❌ Error during shutdown');
        process.exit(1);
      }
    });
  }

  // ========== Start Server ==========
  try {
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`🚀 Gateway API running on http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Start application
bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
