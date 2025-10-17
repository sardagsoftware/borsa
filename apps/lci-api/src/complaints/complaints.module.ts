// LCI API - Complaints Module
// White-hat: Full CRUD with state machine

import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { PrismaService } from '../prisma.service';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [ModerationModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService, PrismaService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
