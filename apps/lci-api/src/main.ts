// LCI API - White-hat production-grade entry point
// Author: Claude + Sardag
// Date: 2025-10-13

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // White-hat security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS - white-hat: restrictive by default
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3200',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // API versioning (v1, v2, etc.)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe - white-hat: validate all inputs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit conversion only
      },
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('LCI API')
    .setDescription(
      'Lydian Complaint Intelligence - KVKK/GDPR Compliant Complaint Management API',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('complaints', 'Complaint Management')
    .addTag('brands', 'Brand Management')
    .addTag('moderation', 'Content Moderation')
    .addTag('legal', 'KVKK/GDPR Compliance')
    .addTag('health', 'Health & Monitoring')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3201;
  await app.listen(port);

  console.log(`
🚀 LCI API started successfully
📍 Port: ${port}
📚 API Docs: http://localhost:${port}/api/docs
🔒 Security: Helmet enabled, CORS restricted
✅ White-hat mode: Active
  `);
}

bootstrap();
