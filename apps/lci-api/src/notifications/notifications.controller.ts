// LCI API - Notifications Controller
// White-hat: Email queue management

import {
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /notifications/process
   * Manually triggers email queue processing
   * White-hat: Only ADMIN
   */
  @Post('process')
  @Roles('ADMIN')
  async processQueue(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    await this.notificationsService.processPendingEmails(limitNum);
    return { message: `Processed up to ${limitNum} emails from queue` };
  }

  /**
   * GET /notifications/templates
   * Lists available email templates
   * White-hat: ADMIN and MODERATOR
   */
  @Get('templates')
  @Roles('ADMIN', 'MODERATOR')
  getTemplates() {
    return {
      templates: [
        {
          name: 'sla_warning',
          description: 'SLA deadline warning (20% time remaining)',
          variables: ['complaintId', 'brandName', 'title', 'remainingHours', 'status', 'dashboardUrl'],
        },
        {
          name: 'sla_breach',
          description: 'SLA deadline breached',
          variables: ['complaintId', 'brandName', 'title', 'overdueHours', 'status', 'dashboardUrl'],
        },
        {
          name: 'new_complaint',
          description: 'New complaint notification for brand',
          variables: ['complaintId', 'title', 'severity', 'publishedAt', 'bodyPreview', 'complaintUrl'],
        },
        {
          name: 'complaint_resolved',
          description: 'Complaint resolved notification for user',
          variables: ['complaintId', 'title', 'brandName', 'resolvedAt', 'complaintUrl'],
        },
        {
          name: 'brand_response',
          description: 'Brand response notification for user',
          variables: ['complaintId', 'title', 'brandName', 'responseMessage', 'complaintUrl'],
        },
      ],
    };
  }
}
