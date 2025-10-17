// LCI API - Create Webhook DTO

import { IsString, IsUrl, IsArray, ArrayMinSize } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  brandId: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'En az 1 event seçilmelidir' })
  @IsString({ each: true })
  events: string[];
}
