// LCI API - Root Application Module
// White-hat: Clean modular architecture

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ModerationModule } from './moderation/moderation.module';
import { StorageModule } from './storage/storage.module';
import { EvidenceModule } from './evidence/evidence.module';
import { BrandsModule } from './brands/brands.module';
import { LegalModule } from './legal/legal.module';
import { SeoModule } from './seo/seo.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Configuration - white-hat: validate env vars
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../infra/lci-db/.env',
    }),

    // Rate limiting - white-hat: 100 req/min default
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),

    // Feature modules
    HealthModule,
    AuthModule,           // ✅ Phase 2.1
    ComplaintsModule,     // ✅ Phase 2.4
    ModerationModule,     // ✅ Phase 2.5
    StorageModule,        // ✅ Phase 2.6
    EvidenceModule,       // ✅ Phase 2.6
    BrandsModule,         // ✅ Phase 3.1
    LegalModule,          // ✅ Phase 3.2
    SeoModule,            // ✅ Phase 4.1 - SEO & Sitemap
    WebhooksModule,       // ✅ Phase 4.2 - Webhook System
    NotificationsModule,  // ✅ Phase 4.3 - Email Notifications
    // UsersModule,       // Phase 2.1
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
