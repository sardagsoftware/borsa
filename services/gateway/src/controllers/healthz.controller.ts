// ========================================
// HEALTH CHECK CONTROLLER
// /healthz endpoint - Comprehensive health check
// SPRINT 0 - DoD Requirement
// ========================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { actionRegistry } from '@lydian/app-sdk';
import {
  checkPostgresHealth,
  checkRedisHealth,
  checkKafkaHealth,
  checkVaultHealth,
} from '../utils/health-checks';

/**
 * Health Check Handler
 * GET /healthz
 *
 * SPRINT 0 DoD: Must return 200 when all services healthy
 */
export async function healthzHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const startTime = Date.now();

  try {
    // Parallel health checks
    const [dbHealth, redisHealth, kafkaHealth, vaultHealth, connectorsHealth] = await Promise.all([
      checkPostgresHealth(),
      checkRedisHealth(),
      checkKafkaHealth(),
      checkVaultHealth(),
      actionRegistry.healthCheck(),
    ]);

    // Determine overall status
    const services = {
      database: dbHealth,
      cache: redisHealth,
      events: kafkaHealth,
      secrets: vaultHealth,
      connectors: {
        healthy: connectorsHealth.healthy,
        total: connectorsHealth.connectors.length,
        healthy_count: connectorsHealth.connectors.filter(c => c.healthy).length,
        details: connectorsHealth.connectors,
      },
    };

    const allHealthy =
      dbHealth.healthy &&
      redisHealth.healthy &&
      kafkaHealth.healthy &&
      vaultHealth.healthy &&
      connectorsHealth.healthy;

    const status = allHealthy
      ? 'healthy'
      : (dbHealth.healthy && connectorsHealth.healthy)
        ? 'degraded'
        : 'unhealthy';

    const statusCode = allHealthy ? 200 : 503;

    return reply.status(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
      services,
    });

  } catch (error: any) {
    request.log.error({ error }, 'Health check failed unexpectedly');

    return reply.status(503).send({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
      error: error.message,
    });
  }
}
