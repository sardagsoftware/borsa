// LCI API - Evidence Module
// White-hat: File upload with security

import { Module } from '@nestjs/common';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../prisma.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, PrismaService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
