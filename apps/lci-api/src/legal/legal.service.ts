// LCI API - Legal Service
// White-hat: KVKK/GDPR compliance (data export + right to be forgotten)

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Exports all user data in JSON format
   * White-hat: KVKK/GDPR data portability right
   */
  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Gather all user data
    const complaints = await this.prisma.complaint.findMany({
      where: { userId },
      include: {
        brand: { select: { name: true, slug: true } },
        product: { select: { name: true } },
        evidence: {
          select: {
            filename: true,
            size: true,
            mimeType: true,
            createdAt: true,
          },
        },
        events: {
          select: {
            type: true,
            actor: true,
            createdAt: true,
          },
        },
        responses: {
          select: {
            message: true,
            createdAt: true,
          },
        },
      },
    });

    // Create export package
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: user.id,
        dataController: 'Lydian Complaint Intelligence (LCI)',
        legalBasis: 'KVKK Madde 11 - Veri Taşınabilirliği Hakkı',
      },
      personalData: {
        email: user.email,
        role: user.role,
        kycLevel: user.kycLevel,
        status: user.status,
        locale: user.locale,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      complaints: complaints.map((c: any) => ({
        id: c.id,
        brand: c.brand,
        product: c.product,
        title: c.title,
        body: c.body,
        severity: c.severity,
        state: c.state,
        publishedAt: c.publishedAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        evidenceCount: c.evidence.length,
        evidence: c.evidence,
        responses: c.responses,
        events: c.events,
      })),
      statistics: {
        totalComplaints: complaints.length,
        complaintsByState: {
          DRAFT: complaints.filter((c: any) => c.state === 'DRAFT').length,
          OPEN: complaints.filter((c: any) => c.state === 'OPEN').length,
          IN_PROGRESS: complaints.filter((c: any) => c.state === 'IN_PROGRESS')
            .length,
          RESOLVED: complaints.filter((c: any) => c.state === 'RESOLVED').length,
          ESCALATED: complaints.filter((c: any) => c.state === 'ESCALATED').length,
          REJECTED: complaints.filter((c: any) => c.state === 'REJECTED').length,
        },
      },
    };

    this.logger.log(`Data export requested for user ${userId}`);

    return exportData;
  }

  /**
   * Requests user data erasure
   * White-hat: KVKK/GDPR right to be forgotten
   */
  async requestErasure(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // White-hat: Check if user can be erased
    // Cannot erase if there are open legal cases or active complaints
    const activeComplaints = await this.prisma.complaint.count({
      where: {
        userId,
        state: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
      },
    });

    if (activeComplaints > 0) {
      throw new BadRequestException(
        `Aktif şikayetleriniz bulunduğu için verileriniz şu anda silinemez. Lütfen tüm şikayetleriniz kapatıldıktan sonra tekrar deneyin. (${activeComplaints} aktif şikayet)`,
      );
    }

    // Create erasure request
    const request = await this.prisma.dataErasureRequest.create({
      data: {
        userId,
        reason: reason || null,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Erasure request created: ${request.id} for user ${userId}`,
    );

    return {
      requestId: request.id,
      status: 'PENDING',
      message:
        'Silme talebiniz alınmıştır. İşleminiz 30 gün içinde tamamlanacaktır. Bu süre içinde talebinizi iptal edebilirsiniz.',
      processingDeadline: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  }

  /**
   * Processes user data erasure (anonymization)
   * White-hat: KVKK Article 7 - Right to erasure
   */
  async processErasure(erasureRequestId: string, adminUserId?: string) {
    const request = await this.prisma.dataErasureRequest.findUnique({
      where: { id: erasureRequestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Silme talebi bulunamadı');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Talep durumu: ${request.status}`);
    }

    const userId = request.userId;

    // White-hat: Anonymize instead of hard delete (preserve data integrity)
    // This maintains referential integrity and complaint history for brands

    await this.prisma.$transaction(async (tx: any) => {
      // 1. Anonymize user account
      const anonymousEmail = `deleted-${createHash('sha256').update(userId).digest('hex').substring(0, 16)}@anonymous.lci`;
      const anonymousHash = createHash('sha256')
        .update(anonymousEmail)
        .digest('hex');

      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          emailHash: anonymousHash,
          passwordHash: '', // Clear password
          status: 'DELETED',
          mfaEnabled: false,
        },
      });

      // 2. Anonymize complaints (preserve for brand statistics)
      await tx.complaint.updateMany({
        where: { userId },
        data: {
          title: '[KULLANICI VERİLERİ SİLİNDİ]',
          body: '[Bu şikayetin içeriği, kullanıcı tarafından KVKK kapsamında silme talebi nedeniyle anonimleştirilmiştir.]',
          searchText: '[DELETED]',
        },
      });

      // 3. Delete evidence files
      const evidence = await tx.evidence.findMany({
        where: {
          complaint: { userId },
        },
      });

      await tx.evidence.deleteMany({
        where: {
          complaint: { userId },
        },
      });

      // Note: In production, also delete actual files from storage
      this.logger.log(
        `Deleted ${evidence.length} evidence files for user ${userId}`,
      );

      // 4. Delete sessions
      // (Assuming we have a Session model in future)

      // 5. Mark erasure request as completed
      await tx.dataErasureRequest.update({
        where: { id: erasureRequestId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          processedBy: adminUserId || 'SYSTEM',
        },
      });

      // 6. Create audit log
      await tx.complaintEvent.create({
        data: {
          complaintId: (
            await tx.complaint.findFirst({ where: { userId } })
          )?.id,
          actor: 'SYSTEM',
          type: 'DATA_ERASURE',
          payload: {
            requestId: erasureRequestId,
            processedBy: adminUserId || 'SYSTEM',
            timestamp: new Date().toISOString(),
          },
        },
      });
    });

    this.logger.log(
      `Data erasure completed for user ${userId} (request: ${erasureRequestId})`,
    );

    return {
      status: 'COMPLETED',
      message:
        'Verileriniz başarıyla anonimleştirilmiştir. Hesabınız kalıcı olarak silinmiştir.',
    };
  }

  /**
   * Cancels a pending erasure request
   */
  async cancelErasure(erasureRequestId: string, userId: string) {
    const request = await this.prisma.dataErasureRequest.findUnique({
      where: { id: erasureRequestId },
    });

    if (!request) {
      throw new NotFoundException('Silme talebi bulunamadı');
    }

    if (request.userId !== userId) {
      throw new BadRequestException('Bu talebi iptal etme yetkiniz yok');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Talep zaten ${request.status} durumunda, iptal edilemez`,
      );
    }

    await this.prisma.dataErasureRequest.update({
      where: { id: erasureRequestId },
      data: {
        status: 'CANCELLED',
        processedAt: new Date(),
      },
    });

    this.logger.log(`Erasure request ${erasureRequestId} cancelled by user`);

    return {
      status: 'CANCELLED',
      message: 'Silme talebiniz iptal edilmiştir',
    };
  }

  /**
   * Gets erasure request status
   */
  async getErasureStatus(userId: string) {
    const requests = await this.prisma.dataErasureRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (requests.length === 0) {
      return {
        hasActiveRequest: false,
        message: 'Aktif silme talebiniz bulunmamaktadır',
      };
    }

    const request = requests[0];

    return {
      hasActiveRequest: request.status === 'PENDING',
      requestId: request.id,
      status: request.status,
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      reason: request.reason,
    };
  }

  /**
   * Lists all pending erasure requests (admin only)
   */
  async listPendingErasures() {
    const requests = await this.prisma.dataErasureRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return requests;
  }
}
