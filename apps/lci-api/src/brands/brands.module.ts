// LCI API - Brands Module
// White-hat: Brand panel with SLA tracking

import { Module } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { SlaService } from './sla.service';
import { SlaMonitorService } from './sla-monitor.service';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [NotificationsModule, WebhooksModule],
  controllers: [BrandsController],
  providers: [BrandsService, SlaService, SlaMonitorService, PrismaService],
  exports: [BrandsService, SlaService, SlaMonitorService],
})
export class BrandsModule {}
