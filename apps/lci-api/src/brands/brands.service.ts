// LCI API - Brands Service
// White-hat: Brand response management + SLA tracking

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SlaService } from './sla.service';
import { CreateResponseDto } from './dto/create-response.dto';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slaService: SlaService,
  ) {}

  /**
   * Lists public brands for complaint form dropdown
   * White-hat: No authentication required, returns minimal info
   */
  async listPublicBrands(status?: string) {
    const where = status === 'ACTIVE' ? { status: 'ACTIVE' as any } : {};

    const brands = await this.prisma.brand.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
      take: 1000, // Reasonable limit
    });

    this.logger.log(`Public brands listed: ${brands.length} brands returned`);
    return brands;
  }

  /**
   * Creates a brand response to a complaint
   * White-hat: Only BRAND_AGENT, MODERATOR, or ADMIN can respond
   */
  async createResponse(
    userId: string,
    userRole: string,
    dto: CreateResponseDto,
  ) {
    // White-hat: Verify complaint exists
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: dto.complaintId },
      include: { brand: true },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // White-hat: Can only respond to OPEN or IN_PROGRESS complaints
    if (!['OPEN', 'IN_PROGRESS'].includes(complaint.state)) {
      throw new BadRequestException(
        'Bu şikayete yanıt verilemez (sadece açık veya işlemde olanlar)',
      );
    }

    // White-hat: BRAND_AGENT can only respond to their own brand's complaints
    // (In production, verify user is assigned to this brand)
    if (userRole === 'BRAND_AGENT') {
      // TODO: Verify brand assignment when we have BrandAgent table
      this.logger.warn(
        `BRAND_AGENT ${userId} responding to complaint ${dto.complaintId} - brand assignment not verified`,
      );
    }

    // Create response record
    const response = await this.prisma.brandResponse.create({
      data: {
        complaintId: dto.complaintId,
        brandId: complaint.brandId,
        message: dto.message,
        respondedBy: userId,
      },
    });

    // Update complaint state if first response
    const responseCount = await this.prisma.brandResponse.count({
      where: { complaintId: dto.complaintId },
    });

    if (responseCount === 1 && complaint.state === 'OPEN') {
      await this.prisma.complaint.update({
        where: { id: dto.complaintId },
        data: { state: 'IN_PROGRESS' },
      });
      this.logger.log(
        `Complaint ${dto.complaintId} moved to IN_PROGRESS after first response`,
      );
    }

    // Create event
    await this.prisma.complaintEvent.create({
      data: {
        complaintId: dto.complaintId,
        actor: userRole as any,
        type: 'RESPONSE',
        payload: {
          responseId: response.id,
          preview: dto.message.substring(0, 100),
        },
      },
    });

    this.logger.log(
      `Brand response created: ${response.id} for complaint ${dto.complaintId}`,
    );

    return response;
  }

  /**
   * Gets brand dashboard statistics
   * White-hat: Only BRAND_AGENT, MODERATOR, or ADMIN
   */
  async getBrandDashboard(brandId: string, userRole: string) {
    // White-hat: Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Marka bulunamadı');
    }

    // Get all complaints for this brand
    const complaints = await this.prisma.complaint.findMany({
      where: { brandId },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Only need first response for SLA
        },
      },
    });

    // Calculate SLA statistics
    const slaStats = this.slaService.calculateBrandStats(complaints);

    // Get complaints by state
    const complaintsByState = {
      DRAFT: complaints.filter((c: any) => c.state === 'DRAFT').length,
      OPEN: complaints.filter((c: any) => c.state === 'OPEN').length,
      IN_PROGRESS: complaints.filter((c: any) => c.state === 'IN_PROGRESS').length,
      RESOLVED: complaints.filter((c: any) => c.state === 'RESOLVED').length,
      ESCALATED: complaints.filter((c: any) => c.state === 'ESCALATED').length,
      REJECTED: complaints.filter((c: any) => c.state === 'REJECTED').length,
    };

    // Get complaints by severity
    const complaintsBySeverity = {
      LOW: complaints.filter((c: any) => c.severity === 'LOW').length,
      MEDIUM: complaints.filter((c: any) => c.severity === 'MEDIUM').length,
      HIGH: complaints.filter((c: any) => c.severity === 'HIGH').length,
      CRITICAL: complaints.filter((c: any) => c.severity === 'CRITICAL').length,
    };

    // Get complaints needing attention (OPEN + no response)
    const complaintsNeedingAttention = complaints.filter(
      (c: any) => c.state === 'OPEN' && c.responses.length === 0,
    );

    // Calculate SLA metrics for complaints needing attention
    const complaintsWithSla = complaintsNeedingAttention.map((complaint: any) => {
      const slaMetrics = this.slaService.calculateSlaMetrics(complaint);
      return {
        id: complaint.id,
        title: complaint.title,
        severity: complaint.severity,
        publishedAt: complaint.publishedAt,
        sla: slaMetrics,
      };
    });

    // Sort by urgency (breached first, then by remaining time)
    complaintsWithSla.sort((a: any, b: any) => {
      if (a.sla.overallStatus === 'RED' && b.sla.overallStatus !== 'RED')
        return -1;
      if (a.sla.overallStatus !== 'RED' && b.sla.overallStatus === 'RED')
        return 1;
      if (a.sla.overallStatus === 'YELLOW' && b.sla.overallStatus === 'GREEN')
        return -1;
      if (a.sla.overallStatus === 'GREEN' && b.sla.overallStatus === 'YELLOW')
        return 1;
      return (
        a.sla.firstResponse.remainingHours - b.sla.firstResponse.remainingHours
      );
    });

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
      },
      statistics: {
        total: slaStats.totalComplaints,
        open: slaStats.openComplaints,
        resolved: slaStats.resolvedComplaints,
        byState: complaintsByState,
        bySeverity: complaintsBySeverity,
      },
      sla: {
        breaches: slaStats.slaBreaches,
        compliance: slaStats.slaCompliance,
        avgResponseTimeHours: slaStats.avgResponseTimeHours,
        avgResolutionTimeHours: slaStats.avgResolutionTimeHours,
      },
      urgentComplaints: complaintsWithSla.slice(0, 10), // Top 10 most urgent
    };
  }

  /**
   * Lists all complaints for a brand
   * White-hat: With SLA metrics
   */
  async listBrandComplaints(brandId: string, userRole: string) {
    // White-hat: Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new NotFoundException('Marka bulunamadı');
    }

    const complaints = await this.prisma.complaint.findMany({
      where: { brandId },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add SLA metrics to each complaint
    const complaintsWithSla = complaints.map((complaint: any) => {
      const slaMetrics = this.slaService.calculateSlaMetrics(complaint);
      return {
        ...complaint,
        sla: slaMetrics,
      };
    });

    return complaintsWithSla;
  }

  /**
   * Gets responses for a complaint
   */
  async getComplaintResponses(complaintId: string, userRole: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    const responses = await this.prisma.brandResponse.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'asc' },
    });

    return responses;
  }
}
