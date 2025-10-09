// ========================================
// RATE LIMIT MIDDLEWARE
// Per-IP rate limiting using Fastify plugin
// White-Hat: 429 responses with Retry-After
// ========================================

import type { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';

export async function registerRateLimitMiddleware(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    max: 100,                    // 100 requests
    timeWindow: '1 minute',      // per minute
    cache: 10000,                // cache 10k IP addresses
    allowList: ['127.0.0.1'],    // Localhost bypass
    redis: undefined,            // TODO: Use Redis in production
    nameSpace: 'lydian-gateway-',
    continueExceeding: true,
    skipOnError: true,
    keyGenerator: (request) => {
      // Use X-Forwarded-For or connection IP
      return request.headers['x-forwarded-for'] as string || request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
          details: {
            limit: context.max,
            remaining: 0,
            retryAfter: context.ttl,
          },
        },
      };
    },
    onExceeding: (request, key) => {
      fastify.log.warn({ ip: key }, 'Rate limit warning');
    },
    onExceeded: (request, key) => {
      fastify.log.error({ ip: key }, 'Rate limit exceeded');
    },
  });

  fastify.log.info('✅ Rate limiting middleware registered');
}
