import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // ──────────────────────────────────────────────────────────
  // STATIC FILES (Dashboard UI)
  // ──────────────────────────────────────────────────────────
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // ──────────────────────────────────────────────────────────
  // SECURITY LAYER (White-Hat Compliance)
  // ──────────────────────────────────────────────────────────

  // Helmet - Security headers (allow inline scripts for dashboard)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }),
  );

  // CORS - Strict origin control
  const allowedOrigins = configService.get<string>('CORS_ORIGIN')?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Region', 'X-Request-ID'],
  });

  // Global validation pipe (Zod/class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('v7.3/ecw');

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server
  const port = configService.get<number>('PORT', 3200);
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║  🌍 ECW API - Ethical Climate Wallet (v7.3)              ║
  ║                                                           ║
  ║  Status:  🟢 RUNNING                                      ║
  ║  Port:    ${port}                                            ║
  ║  Env:     ${configService.get<string>('NODE_ENV', 'development')}                                    ║
  ║  Region:  ${configService.get<string>('ECW_REGION_DEFAULT', 'EU')}                                              ║
  ║                                                           ║
  ║  Security: Helmet ✓ | CORS ✓ | Validation ✓              ║
  ║  Ethics:   ACE ✓ | ESK ✓ | OPA ✓ | DP ✓                  ║
  ║                                                           ║
  ║  Dashboard: http://localhost:${port}/                      ║
  ║  API:       http://localhost:${port}/v7.3/ecw/            ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('💥 Bootstrap failed:', err);
  process.exit(1);
});
