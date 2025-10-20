// LCI API - Legal Controller
// White-hat: KVKK/GDPR compliance endpoints

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LegalService } from './legal.service';
import { EraseDataDto } from './dto/erase-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('legal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  /**
   * Export user data (KVKK/GDPR data portability right)
   * GET /legal/export
   * Auth: Authenticated user
   * Returns: Complete user data export in JSON format
   */
  @Get('export')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  async exportData(@Req() req: any) {
    return this.legalService.exportUserData(req.user.userId);
  }

  /**
   * Request data erasure (KVKK/GDPR right to be forgotten)
   * POST /legal/erase
   * Auth: Authenticated user
   * Body: { reason?: string }
   * Returns: Erasure request details with processing deadline
   */
  @Post('erase')
  @Throttle({ default: { limit: 2, ttl: 86400000 } }) // 2 requests per day
  async requestErasure(@Req() req: any, @Body() dto: EraseDataDto) {
    return this.legalService.requestErasure(req.user.userId, dto.reason);
  }

  /**
   * Cancel pending erasure request
   * DELETE /legal/erase/:requestId
   * Auth: Authenticated user (must own the request)
   * Returns: Cancellation confirmation
   */
  @Delete('erase/:requestId')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour
  async cancelErasure(@Req() req: any, @Param('requestId') requestId: string) {
    return this.legalService.cancelErasure(requestId, req.user.userId);
  }

  /**
   * Get erasure request status
   * GET /legal/erase/status
   * Auth: Authenticated user
   * Returns: Current erasure request status (if any)
   */
  @Get('erase/status')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  async getErasureStatus(@Req() req: any) {
    return this.legalService.getErasureStatus(req.user.userId);
  }

  /**
   * Process erasure request (ADMIN only)
   * POST /legal/erase/:requestId/process
   * Auth: ADMIN
   * Returns: Processing confirmation
   * White-hat: Requires admin approval to ensure legal review
   */
  @Post('erase/:requestId/process')
  @Roles('ADMIN')
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 requests per hour
  async processErasure(
    @Req() req: any,
    @Param('requestId') requestId: string,
  ) {
    return this.legalService.processErasure(requestId, req.user.userId);
  }

  /**
   * List all pending erasure requests (ADMIN only)
   * GET /legal/erase/pending
   * Auth: ADMIN
   * Returns: Array of pending erasure requests
   */
  @Get('erase/pending')
  @Roles('ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async listPendingErasures() {
    return this.legalService.listPendingErasures();
  }
}
