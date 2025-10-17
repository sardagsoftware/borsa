// LCI API - Legal Module
// White-hat: KVKK/GDPR compliance module

import { Module } from '@nestjs/common';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [LegalController],
  providers: [LegalService, PrismaService],
  exports: [LegalService],
})
export class LegalModule {}
