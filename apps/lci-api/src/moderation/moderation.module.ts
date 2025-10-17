// LCI API - Moderation Module
// White-hat: PII masking and content moderation

import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Module({
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
