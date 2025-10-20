// LCI API - Register DTO
// White-hat: Strict validation

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)',
  })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @MaxLength(128, { message: 'Şifre en fazla 128 karakter olabilir' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
  })
  password: string;

  @ApiProperty({
    example: 'tr',
    description: 'User locale (tr, en)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}
