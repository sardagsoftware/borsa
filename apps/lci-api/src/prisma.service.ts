// LCI API - Prisma Service
// White-hat: Singleton pattern with proper connection management

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    // White-hat: Log query performance in dev only
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        if (e.duration > 1000) {
          this.logger.warn(`Slow query detected: ${e.duration}ms`);
        }
      });
    }

    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
    });

    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // White-hat: Soft delete helpers
  async softDelete(model: string, id: string) {
    return (this as any)[model].update({
      where: { id },
      data: { status: 'DELETED', updatedAt: new Date() },
    });
  }

  // White-hat: Health check helper
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
