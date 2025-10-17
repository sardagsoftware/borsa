// LCI API - Create Complaint DTO
// White-hat: Strict validation

import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateComplaintDto {
  @IsUUID()
  brandId: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  @MinLength(10, { message: 'Başlık en az 10 karakter olmalıdır' })
  @MaxLength(500, { message: 'Başlık en fazla 500 karakter olabilir' })
  title: string;

  @IsString()
  @MinLength(50, { message: 'Şikayet metni en az 50 karakter olmalıdır' })
  @MaxLength(5000, { message: 'Şikayet metni en fazla 5000 karakter olabilir' })
  body: string;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity?: string;
}
