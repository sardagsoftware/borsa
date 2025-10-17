// LCI API - Webhooks Controller
// White-hat: Brand webhook management

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * POST /webhooks
   * Creates a new webhook for a brand
   * White-hat: Only BRAND_AGENT, MODERATOR, or ADMIN
   */
  @Post()
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  async createWebhook(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.createWebhook(dto.brandId, dto.url, dto.events);
  }

  /**
   * GET /webhooks/brand/:brandId
   * Lists all webhooks for a brand
   */
  @Get('brand/:brandId')
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async listWebhooks(@Param('brandId') brandId: string) {
    return this.webhooksService.listWebhooks(brandId);
  }

  /**
   * PATCH /webhooks/:id
   * Updates a webhook
   */
  @Patch(':id')
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
    @Req() req: any,
  ) {
    // In production, verify user has access to this webhook's brand
    // For now, we'll need brandId in the body or verify via webhook lookup
    const webhook = await this.webhooksService['prisma'].webhook.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return this.webhooksService.updateWebhook(id, webhook.brandId, dto);
  }

  /**
   * DELETE /webhooks/:id
   * Deletes a webhook
   */
  @Delete(':id')
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async deleteWebhook(@Param('id') id: string) {
    // Get brandId from webhook
    const webhook = await this.webhooksService['prisma'].webhook.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    return this.webhooksService.deleteWebhook(id, webhook.brandId);
  }

  /**
   * GET /webhooks/:id/deliveries
   * Gets delivery history for a webhook
   */
  @Get(':id/deliveries')
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async getDeliveries(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    // Get brandId from webhook
    const webhook = await this.webhooksService['prisma'].webhook.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.webhooksService.getDeliveries(id, webhook.brandId, limitNum);
  }
}
