// LCI API - Complaints Service
// White-hat: Business logic + State machine

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { TransitionStateDto } from './dto/transition-state.dto';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  // State machine transitions matrix
  private readonly STATE_TRANSITIONS = {
    DRAFT: ['OPEN'],
    OPEN: ['IN_PROGRESS', 'REJECTED'],
    IN_PROGRESS: ['RESOLVED', 'ESCALATED', 'OPEN'],
    RESOLVED: ['ESCALATED'],
    ESCALATED: ['IN_PROGRESS', 'RESOLVED'],
    REJECTED: [], // Terminal state
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly moderationService: ModerationService,
  ) {}

  async create(userId: string, dto: CreateComplaintDto) {
    // White-hat: Verify brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id: dto.brandId },
    });

    if (!brand) {
      throw new NotFoundException('Marka bulunamadı');
    }

    // White-hat: If productId provided, verify it belongs to brand
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: dto.productId,
          brandId: dto.brandId,
        },
      });

      if (!product) {
        throw new BadRequestException('Ürün bu markaya ait değil');
      }
    }

    // White-hat: Automatic PII moderation
    const moderated = await this.moderationService.moderateComplaint(
      dto.title,
      dto.body,
    );

    // Log moderation results
    if (moderated.flags.hasPII) {
      this.logger.warn(
        `PII detected and masked in complaint: ${moderated.flags.piiTypes.join(', ')} (${moderated.flags.piiMaskCount} instances)`,
      );
    }

    // Create complaint with moderated content
    const complaint = await this.prisma.complaint.create({
      data: {
        userId,
        brandId: dto.brandId,
        productId: dto.productId,
        title: moderated.title, // ✅ Moderated title
        body: moderated.body,   // ✅ Moderated body
        severity: (dto.severity as any) || 'MEDIUM',
        state: 'DRAFT',
        searchText: `${moderated.title} ${moderated.body}`, // For full-text search
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Complaint created: ${complaint.id} by user ${userId}`);

    return complaint;
  }

  async findAll(userId: string, userRole: string) {
    // White-hat: Users only see their own complaints
    // Moderators/Admins see all
    const where =
      userRole === 'USER'
        ? { userId }
        : {}; // Moderators and admins see all

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return complaints;
  }

  async findOne(id: string, userId: string, userRole: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        events: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // White-hat: Access control
    if (userRole === 'USER' && complaint.userId !== userId) {
      throw new ForbiddenException('Bu şikayete erişim yetkiniz yok');
    }

    return complaint;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateComplaintDto) {
    const complaint = await this.findOne(id, userId, userRole);

    // White-hat: Only owner can update if in DRAFT state
    if (complaint.state !== 'DRAFT') {
      throw new BadRequestException('Sadece taslak şikayetler düzenlenebilir');
    }

    if (userRole === 'USER' && complaint.userId !== userId) {
      throw new ForbiddenException('Bu şikayeti düzenleme yetkiniz yok');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.body) updateData.body = dto.body;
    if (dto.severity) updateData.severity = dto.severity;
    if (dto.title || dto.body) {
      updateData.searchText = `${dto.title || complaint.title} ${dto.body || complaint.body}`;
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Complaint updated: ${id}`);

    return updated;
  }

  async transitionState(
    id: string,
    userId: string,
    userRole: string,
    dto: TransitionStateDto,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // White-hat: Access control for state transitions
    // DRAFT -> OPEN: Only owner
    if (complaint.state === 'DRAFT' && dto.newState === 'OPEN') {
      if (complaint.userId !== userId) {
        throw new ForbiddenException('Sadece şikayet sahibi yayınlayabilir');
      }
    }

    // Other transitions: Brand agents, moderators, or admins
    if (complaint.state !== 'DRAFT' && userRole === 'USER') {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }

    // White-hat: Validate state transition
    const allowedTransitions = this.STATE_TRANSITIONS[complaint.state as keyof typeof this.STATE_TRANSITIONS] as string[];
    if (!allowedTransitions.includes(dto.newState)) {
      throw new BadRequestException(
        `${complaint.state} durumundan ${dto.newState} durumuna geçiş yapılamaz`,
      );
    }

    // Update state and create event
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const updatedComplaint = await tx.complaint.update({
        where: { id },
        data: {
          state: dto.newState as any,
          publishedAt: dto.newState === 'OPEN' ? new Date() : undefined,
        },
      });

      // Create state change event
      await tx.complaintEvent.create({
        data: {
          complaintId: id,
          actor: userRole as any,
          type: 'STATE_CHANGE',
          payload: {
            oldState: complaint.state,
            newState: dto.newState,
            notes: dto.notes,
          },
        },
      });

      return updatedComplaint;
    });

    this.logger.log(
      `Complaint ${id} transitioned from ${complaint.state} to ${dto.newState}`,
    );

    return updated;
  }

  async delete(id: string, userId: string, userRole: string) {
    const complaint = await this.findOne(id, userId, userRole);

    // White-hat: Only owner can delete if in DRAFT state
    if (complaint.state !== 'DRAFT') {
      throw new BadRequestException('Sadece taslak şikayetler silinebilir');
    }

    if (userRole === 'USER' && complaint.userId !== userId) {
      throw new ForbiddenException('Bu şikayeti silme yetkiniz yok');
    }

    await this.prisma.complaint.delete({
      where: { id },
    });

    this.logger.log(`Complaint deleted: ${id}`);

    return { message: 'Şikayet silindi' };
  }
}
