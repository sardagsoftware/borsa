// LCI API - Health Check Service
// White-hat: Dependency health monitoring

import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const isDbHealthy = await this.prisma.healthCheck();

    return {
      status: isDbHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async detailedCheck() {
    const startTime = Date.now();

    // Database health check
    const dbHealthy = await this.prisma.healthCheck();
    const dbLatency = Date.now() - startTime;

    // Memory usage
    const memoryUsage = process.memoryUsage();

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: {
          status: dbHealthy ? 'up' : 'down',
          latency: `${dbLatency}ms`,
        },
      },
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        nodeVersion: process.version,
      },
    };
  }
}
