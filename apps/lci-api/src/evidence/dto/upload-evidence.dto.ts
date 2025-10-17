// LCI API - Upload Evidence DTO
// White-hat: File upload validation

import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadEvidenceDto {
  @IsUUID()
  complaintId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
