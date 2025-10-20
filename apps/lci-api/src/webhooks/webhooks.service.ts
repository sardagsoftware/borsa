// LCI API - Webhooks Service
// White-hat: HMAC-signed webhooks for brand integrations

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: any;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a webhook for a brand
   * White-hat: Generate secure random secret for HMAC
   */
  async createWebhook(brandId: string, url: string, events: string[]) {
    // Validate brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Marka bulunamadı');
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Geçersiz webhook URL');
    }

    // Validate events
    const validEvents = [
      'complaint.created',
      'complaint.updated',
      'complaint.state_changed',
      'complaint.resolved',
      'complaint.escalated',
      'response.created',
      'evidence.uploaded',
    ];

    const invalidEvents = events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      throw new BadRequestException(
        `Geçersiz event'ler: ${invalidEvents.join(', ')}`,
      );
    }

    // Generate secure random secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await this.prisma.webhook.create({
      data: {
        brandId,
        url,
        secret,
        events,
      },
    });

    this.logger.log(`Webhook created: ${webhook.id} for brand ${brandId}`);

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret, // Return only once for brand to store
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * Lists webhooks for a brand
   * White-hat: Don't return secret in list (security)
   */
  async listWebhooks(brandId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { brandId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastSuccess: true,
        lastFailure: true,
        failCount: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret
      },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks;
  }

  /**
   * Updates a webhook
   */
  async updateWebhook(
    webhookId: string,
    brandId: string,
    updates: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, brandId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook bulunamadı');
    }

    const updated = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: updates,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Webhook updated: ${webhookId}`);

    return updated;
  }

  /**
   * Deletes a webhook
   */
  async deleteWebhook(webhookId: string, brandId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, brandId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook bulunamadı');
    }

    await this.prisma.webhook.delete({
      where: { id: webhookId },
    });

    this.logger.log(`Webhook deleted: ${webhookId}`);

    return { message: 'Webhook silindi' };
  }

  /**
   * Delivers a webhook event
   * White-hat: HMAC signature for security, retry logic
   */
  async deliverEvent(brandId: string, event: string, data: any) {
    // Find active webhooks subscribed to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        brandId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No webhooks for event ${event} for brand ${brandId}`);
      return;
    }

    const payload: WebhookEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Deliver to all webhooks (async, don't block)
    for (const webhook of webhooks) {
      this.deliverToWebhook(webhook, payload).catch((error) => {
        this.logger.error(
          `Webhook delivery failed: ${webhook.id} - ${error.message}`,
        );
      });
    }
  }

  /**
   * Delivers payload to a single webhook with retry logic
   * White-hat: HMAC-SHA256 signature
   */
  private async deliverToWebhook(webhook: any, payload: WebhookEvent) {
    let attemptNumber = 1;
    let lastError: Error | null = null;

    while (attemptNumber <= this.maxRetries) {
      try {
        const payloadString = JSON.stringify(payload);

        // Generate HMAC-SHA256 signature
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(payloadString)
          .digest('hex');

        // Send HTTP POST request
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LCI-Signature': `sha256=${signature}`,
            'X-LCI-Event': payload.event,
            'X-LCI-Timestamp': payload.timestamp,
            'User-Agent': 'LCI-Webhooks/1.0',
          },
          body: payloadString,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        const responseText = await response.text();

        // Log delivery
        await this.prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: payload.event,
            payload: payload.data,
            response: responseText.substring(0, 1000), // Limit response size
            statusCode: response.status,
            success: response.ok,
            attemptNumber,
          },
        });

        if (response.ok) {
          // Success!
          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastSuccess: new Date(),
              failCount: 0, // Reset fail count on success
            },
          });

          this.logger.log(
            `Webhook delivered: ${webhook.id} - ${payload.event} (attempt ${attemptNumber})`,
          );

          return; // Success, exit retry loop
        } else {
          // HTTP error
          lastError = new Error(`HTTP ${response.status}: ${responseText}`);
        }
      } catch (error: any) {
        lastError = error;
      }

      // Retry logic
      if (attemptNumber < this.maxRetries) {
        this.logger.warn(
          `Webhook delivery attempt ${attemptNumber} failed for ${webhook.id}, retrying...`,
        );
        await this.sleep(this.retryDelay * attemptNumber); // Exponential backoff
        attemptNumber++;
      } else {
        // All retries failed
        await this.prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastFailure: new Date(),
            failCount: { increment: 1 },
          },
        });

        this.logger.error(
          `Webhook delivery failed after ${this.maxRetries} attempts: ${webhook.id} - ${lastError?.message}`,
        );

        // Log final failure
        await this.prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: payload.event,
            payload: payload.data,
            response: lastError?.message,
            statusCode: null,
            success: false,
            attemptNumber,
          },
        });

        throw lastError;
      }
    }
  }

  /**
   * Gets webhook deliveries (audit log)
   */
  async getDeliveries(webhookId: string, brandId: string, limit = 50) {
    // Verify webhook belongs to brand
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, brandId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook bulunamadı');
    }

    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return deliveries;
  }

  /**
   * Verifies HMAC signature (for brand's webhook endpoint)
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
