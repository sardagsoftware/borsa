// LCI API - Erase Data DTO
// White-hat: KVKK/GDPR right to be forgotten

import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EraseDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string; // Optional reason for erasure request
}
