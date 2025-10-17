// LCI API - SLA Monitoring Service
// White-hat: Automated SLA tracking and notifications

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { SlaService } from './sla.service';

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slaService: SlaService,
    private readonly notificationsService: NotificationsService,
    private readonly webhooksService: WebhooksService,
  ) {}

  /**
   * Monitors SLA violations and sends warnings/breach notifications
   * Should be called by a cron job every 30 minutes
   */
  async monitorSlaViolations() {
    this.logger.log('Starting SLA monitoring cycle...');

    try {
      // Get all OPEN complaints (not yet responded to)
      const openComplaints = await this.prisma.complaint.findMany({
        where: {
          state: 'OPEN',
          publishedAt: { not: null },
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              slaHours: true,
              agents: {
                select: { email: true },
                take: 1, // Get first agent email
              },
            },
          },
          responses: {
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      this.logger.log(`Found ${openComplaints.length} open complaints to monitor`);

      let warningsSent = 0;
      let breachesSent = 0;

      for (const complaint of openComplaints) {
        const slaMetrics = this.slaService.calculateSlaMetrics(complaint as any);

        // Skip if already responded
        if (complaint.responses.length > 0) {
          continue;
        }

        // Get brand agent email
        const brandEmail = complaint.brand.agents[0]?.email;
        if (!brandEmail) {
          this.logger.warn(
            `No email found for brand ${complaint.brand.id} (complaint ${complaint.id})`,
          );
          continue;
        }

        // Check for breach (deadline passed)
        if (slaMetrics.firstResponse.breached) {
          // Check if breach notification already sent
          const alreadySent = await this.checkNotificationSent(
            complaint.id,
            'sla_breach',
          );

          if (!alreadySent) {
            await this.sendBreachNotification(complaint as any, brandEmail, slaMetrics);
            breachesSent++;
          }
        }
        // Check for warning (20% time remaining)
        else if (!slaMetrics.firstResponse.breached && slaMetrics.firstResponse.remainingHours < (slaMetrics.firstResponse.targetHours * 0.2)) {
          // Check if warning notification already sent
          const alreadySent = await this.checkNotificationSent(
            complaint.id,
            'sla_warning',
          );

          if (!alreadySent) {
            await this.sendWarningNotification(complaint as any, brandEmail, slaMetrics);
            warningsSent++;
          }
        }
      }

      this.logger.log(
        `SLA monitoring complete: ${warningsSent} warnings, ${breachesSent} breaches`,
      );

      return {
        complaintsMonitored: openComplaints.length,
        warningsSent,
        breachesSent,
      };
    } catch (error: any) {
      this.logger.error(`SLA monitoring failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sends SLA warning notification (email + webhook)
   */
  private async sendWarningNotification(
    complaint: any,
    brandEmail: string,
    slaMetrics: any,
  ) {
    this.logger.log(
      `Sending SLA warning for complaint ${complaint.id} (${slaMetrics.firstResponse.remainingHours}h remaining)`,
    );

    // Queue email notification
    await this.notificationsService.queueSlaWarning(complaint.id, brandEmail, {
      brandName: complaint.brand.name,
      title: complaint.title,
      remainingHours: Math.round(slaMetrics.firstResponse.remainingHours),
      status: complaint.state,
      dashboardUrl: `${process.env.BASE_URL || 'https://lci.lydian.ai'}/brands/${complaint.brand.slug}/dashboard`,
    });

    // Send webhook event
    await this.webhooksService.deliverEvent(
      complaint.brandId,
      'complaint.sla_warning',
      {
        complaintId: complaint.id,
        title: complaint.title,
        severity: complaint.severity,
        remainingHours: slaMetrics.firstResponse.remainingHours,
        deadlineAt: slaMetrics.firstResponse.deadlineAt,
      },
    );

    this.logger.log(`SLA warning sent for complaint ${complaint.id}`);
  }

  /**
   * Sends SLA breach notification (email + webhook)
   */
  private async sendBreachNotification(
    complaint: any,
    brandEmail: string,
    slaMetrics: any,
  ) {
    this.logger.log(
      `Sending SLA breach notification for complaint ${complaint.id} (${Math.abs(slaMetrics.firstResponse.remainingHours)}h overdue)`,
    );

    // Queue email notification
    await this.notificationsService.queueSlaBreach(complaint.id, brandEmail, {
      brandName: complaint.brand.name,
      title: complaint.title,
      overdueHours: Math.abs(
        Math.round(slaMetrics.firstResponse.remainingHours),
      ),
      status: complaint.state,
      dashboardUrl: `${process.env.BASE_URL || 'https://lci.lydian.ai'}/brands/${complaint.brand.slug}/dashboard`,
    });

    // Send webhook event
    await this.webhooksService.deliverEvent(
      complaint.brandId,
      'complaint.sla_breach',
      {
        complaintId: complaint.id,
        title: complaint.title,
        severity: complaint.severity,
        overdueHours: Math.abs(slaMetrics.firstResponse.remainingHours),
        deadlineAt: slaMetrics.firstResponse.deadlineAt,
      },
    );

    this.logger.log(`SLA breach notification sent for complaint ${complaint.id}`);
  }

  /**
   * Checks if a notification was already sent to avoid duplicates
   * White-hat: Prevents spam
   */
  private async checkNotificationSent(
    complaintId: string,
    template: 'sla_warning' | 'sla_breach',
  ): Promise<boolean> {
    const existing = await this.prisma.emailNotification.findFirst({
      where: {
        template,
        variables: {
          path: ['complaintId'],
          equals: complaintId,
        },
      },
    });

    return !!existing;
  }

  /**
   * Sends notifications when complaints are resolved
   * Called when complaint transitions to RESOLVED state
   */
  async notifyComplaintResolved(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        brand: {
          select: { name: true, slug: true },
        },
        user: {
          select: { email: true },
        },
      },
    });

    if (!complaint) {
      return;
    }

    this.logger.log(`Sending resolved notification for complaint ${complaintId}`);

    // Email to user
    await this.notificationsService.queueComplaintResolved(
      complaint.user.email,
      {
        complaintId: complaint.id,
        title: complaint.title,
        brandName: complaint.brand.name,
        resolvedAt: new Date().toISOString(),
        complaintUrl: `${process.env.BASE_URL || 'https://lci.lydian.ai'}/brands/${complaint.brand.slug}/complaints/${complaint.id}`,
      },
    );

    // Webhook event
    await this.webhooksService.deliverEvent(
      complaint.brandId,
      'complaint.resolved',
      {
        complaintId: complaint.id,
        title: complaint.title,
        severity: complaint.severity,
        resolvedAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Sends notifications when brand responds
   * Called when BrandResponse is created
   */
  async notifyBrandResponse(complaintId: string, responseMessage: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        brand: {
          select: { name: true, slug: true },
        },
        user: {
          select: { email: true },
        },
      },
    });

    if (!complaint) {
      return;
    }

    this.logger.log(`Sending brand response notification for complaint ${complaintId}`);

    // Email to user
    await this.notificationsService.queueBrandResponse(complaint.user.email, {
      complaintId: complaint.id,
      title: complaint.title,
      brandName: complaint.brand.name,
      responseMessage: responseMessage.substring(0, 200), // Limit length
      complaintUrl: `${process.env.BASE_URL || 'https://lci.lydian.ai'}/brands/${complaint.brand.slug}/complaints/${complaint.id}`,
    });

    // Webhook event
    await this.webhooksService.deliverEvent(complaint.brandId, 'response.created', {
      complaintId: complaint.id,
      responseMessage: responseMessage.substring(0, 200),
      createdAt: new Date().toISOString(),
    });
  }
}
