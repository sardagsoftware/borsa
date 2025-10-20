// LCI API - SEO Module

import { Module } from '@nestjs/common';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SeoController],
  providers: [SeoService, PrismaService],
  exports: [SeoService],
})
export class SeoModule {}
