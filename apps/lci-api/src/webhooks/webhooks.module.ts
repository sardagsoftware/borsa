// LCI API - Webhooks Module

import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
  exports: [WebhooksService], // Export for use in other modules
})
export class WebhooksModule {}
