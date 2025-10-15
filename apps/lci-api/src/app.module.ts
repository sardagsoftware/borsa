// LCI API - Root Application Module
// White-hat: Clean modular architecture

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

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
    AuthModule,        // ✅ Phase 2.1
    // UsersModule,       // Phase 2.1
    // ComplaintsModule,  // Phase 2.2
    // BrandsModule,      // Phase 3.1
    // ModerationModule,  // Phase 2.3
    // LegalModule,       // Phase 3.2
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
