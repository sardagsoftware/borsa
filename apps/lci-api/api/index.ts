// Vercel Serverless Entry Point for LCI API
// This file is required for Vercel to recognize the NestJS app

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import * as express from 'express';

const expressApp = express();
let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'log'],
      },
    );

    // Enable CORS
    app.enableCors({
      origin: [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Set global prefix
    app.setGlobalPrefix('v1');

    // Initialize app
    await app.init();
  }
  return expressApp;
}

// Export for Vercel
export default async (req: any, res: any) => {
  const server = await createApp();
  server(req, res);
};
