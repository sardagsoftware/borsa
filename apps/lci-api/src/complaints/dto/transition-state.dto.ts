// LCI API - Transition State DTO
// White-hat: State machine transitions

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class TransitionStateDto {
  @IsEnum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'REJECTED'])
  newState: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
