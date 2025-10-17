// LCI API - Create Brand Response DTO
// White-hat: Brand response to complaints

import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateResponseDto {
  @IsUUID()
  complaintId: string;

  @IsString()
  @MinLength(20, { message: 'Yanıt en az 20 karakter olmalıdır' })
  @MaxLength(5000, { message: 'Yanıt en fazla 5000 karakter olabilir' })
  message: string;
}
