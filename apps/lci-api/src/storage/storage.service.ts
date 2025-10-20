// LCI API - Storage Service
// White-hat: File storage with security checks (local stub, S3 in production)

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = join(process.cwd(), 'uploads', 'evidence');
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  // Allowed MIME types for evidence files
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ];

  constructor() {
    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Validates file before upload
   * White-hat: Multiple security checks
   */
  validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Dosya boyutu çok büyük. Maksimum ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Desteklenmeyen dosya tipi: ${file.mimetype}. İzin verilen: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension (defense in depth)
    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.pdf',
      '.mp4',
      '.mov',
      '.avi',
    ];
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new BadRequestException(`Desteklenmeyen dosya uzantısı: ${ext}`);
    }

    // Check filename for malicious patterns
    const dangerousPatterns = [
      /\.\./,
      /[<>:"|?*]/,
      /^\./, // Hidden files
      /\.exe$/i,
      /\.sh$/i,
      /\.bat$/i,
      /\.cmd$/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.originalname)) {
        throw new BadRequestException(
          'Dosya adı güvenli değil (geçersiz karakterler)',
        );
      }
    }
  }

  /**
   * Saves file to local storage
   * Returns file metadata
   * White-hat: Uses UUID for filename to prevent path traversal
   */
  async saveFile(
    file: Express.Multer.File,
    complaintId: string,
  ): Promise<{
    fileId: string;
    filename: string;
    mimeType: string;
    size: number;
    path: string;
  }> {
    // Validate file
    this.validateFile(file);

    // Generate safe filename using UUID
    const fileId = randomUUID();
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    const safeFilename = `${fileId}${ext}`;
    const filePath = join(this.uploadDir, safeFilename);

    // Save file
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.write(file.buffer);
      writeStream.end();

      writeStream.on('finish', () => {
        this.logger.log(
          `File saved: ${safeFilename} for complaint ${complaintId}`,
        );
        resolve({
          fileId,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: filePath,
        });
      });

      writeStream.on('error', (error) => {
        this.logger.error(`File save error: ${error.message}`);
        reject(new BadRequestException('Dosya kaydedilemedi'));
      });
    });
  }

  /**
   * Virus scan stub
   * White-hat: In production, integrate with ClamAV or commercial scanner
   */
  async scanFile(file: Express.Multer.File): Promise<{
    isClean: boolean;
    scanResult: string;
  }> {
    this.logger.log(
      `[STUB] Virus scan for file: ${file.originalname} (${file.size} bytes)`,
    );

    // Stub implementation: Always returns clean
    // In production, integrate with ClamAV:
    // - Install ClamAV
    // - Use node-clamav or similar
    // - Scan file buffer
    // - Return real scan results

    // Simulate scan delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Basic heuristic: Check file size (very large files suspicious)
    if (file.size > 50 * 1024 * 1024) {
      this.logger.warn(
        `Suspicious file size: ${file.size} bytes (${file.originalname})`,
      );
      return {
        isClean: false,
        scanResult: 'SUSPICIOUS_SIZE',
      };
    }

    // Stub: Always clean for development
    return {
      isClean: true,
      scanResult: 'OK',
    };
  }

  /**
   * Gets file metadata from path
   */
  getFilePath(fileId: string, ext: string): string {
    return join(this.uploadDir, `${fileId}${ext}`);
  }
}
