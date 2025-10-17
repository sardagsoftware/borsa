// LCI API - Evidence Service
// White-hat: Evidence file management with virus scanning

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Uploads evidence file for a complaint
   * White-hat: Multi-layer security checks
   */
  async uploadEvidence(
    userId: string,
    complaintId: string,
    file: Express.Multer.File,
    description?: string,
  ) {
    // White-hat: Verify complaint exists and user has access
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // White-hat: Only complaint owner can upload evidence
    if (complaint.userId !== userId) {
      throw new ForbiddenException(
        'Sadece şikayet sahibi dosya yükleyebilir',
      );
    }

    // White-hat: Only DRAFT and OPEN complaints can have evidence added
    if (!['DRAFT', 'OPEN'].includes(complaint.state)) {
      throw new BadRequestException(
        'Bu aşamada dosya yüklenemez (sadece taslak ve açık şikayetler)',
      );
    }

    // White-hat: Check complaint doesn't have too many evidence files
    const existingCount = await this.prisma.evidence.count({
      where: { complaintId },
    });

    if (existingCount >= 10) {
      throw new BadRequestException(
        'Maksimum 10 dosya yüklenebilir (limit: 10)',
      );
    }

    // White-hat: Virus scan before storage
    const scanResult = await this.storageService.scanFile(file);
    if (!scanResult.isClean) {
      this.logger.warn(
        `Virus scan failed for file: ${file.originalname} - ${scanResult.scanResult}`,
      );
      throw new BadRequestException(
        'Dosya güvenlik taramasından geçemedi (virüs veya zararlı içerik)',
      );
    }

    // Save file to storage
    const savedFile = await this.storageService.saveFile(file, complaintId);

    // Create evidence record in database
    const evidence = await this.prisma.evidence.create({
      data: {
        complaintId,
        filename: savedFile.filename,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
        key: savedFile.path, // Storage key/path
        sha256: savedFile.fileId, // Using fileId as sha256 hash
      },
    });

    this.logger.log(
      `Evidence uploaded: ${evidence.id} for complaint ${complaintId}`,
    );

    return evidence;
  }

  /**
   * Lists all evidence for a complaint
   * White-hat: Access control - only owner or moderators
   */
  async listEvidence(userId: string, userRole: string, complaintId: string) {
    // Verify complaint exists
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Şikayet bulunamadı');
    }

    // White-hat: Access control
    if (userRole === 'USER' && complaint.userId !== userId) {
      throw new ForbiddenException('Bu şikayetin dosyalarına erişim yetkiniz yok');
    }

    const evidence = await this.prisma.evidence.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' },
    });

    return evidence;
  }

  /**
   * Deletes evidence file
   * White-hat: Only owner can delete, only in DRAFT/OPEN state
   */
  async deleteEvidence(userId: string, userRole: string, evidenceId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { complaint: true },
    });

    if (!evidence) {
      throw new NotFoundException('Dosya bulunamadı');
    }

    // White-hat: Access control - only owner can delete
    if (userRole === 'USER' && evidence.complaint.userId !== userId) {
      throw new ForbiddenException('Bu dosyayı silme yetkiniz yok');
    }

    // White-hat: Can only delete in DRAFT/OPEN state
    if (!['DRAFT', 'OPEN'].includes(evidence.complaint.state)) {
      throw new BadRequestException(
        'Bu aşamada dosya silinemez (sadece taslak ve açık şikayetler)',
      );
    }

    // Delete from database
    await this.prisma.evidence.delete({
      where: { id: evidenceId },
    });

    // Note: In production, also delete from S3/storage
    // For now, we keep files on disk for debugging

    this.logger.log(`Evidence deleted: ${evidenceId}`);

    return { message: 'Dosya silindi' };
  }

  /**
   * Gets single evidence file
   * White-hat: Access control
   */
  async getEvidence(userId: string, userRole: string, evidenceId: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { complaint: true },
    });

    if (!evidence) {
      throw new NotFoundException('Dosya bulunamadı');
    }

    // White-hat: Access control
    if (userRole === 'USER' && evidence.complaint.userId !== userId) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok');
    }

    return evidence;
  }
}
