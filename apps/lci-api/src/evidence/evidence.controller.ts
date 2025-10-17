// LCI API - Evidence Controller
// White-hat: File upload endpoints with security

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { EvidenceService } from './evidence.service';
import { UploadEvidenceDto } from './dto/upload-evidence.dto';

@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Req() req: any,
    @Body() dto: UploadEvidenceDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|mp4|mov|avi)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.evidenceService.uploadEvidence(
      req.user.userId,
      dto.complaintId,
      file,
      dto.description,
    );
  }

  @Get('complaint/:complaintId')
  async listEvidence(@Req() req: any, @Param('complaintId') complaintId: string) {
    return this.evidenceService.listEvidence(
      req.user.userId,
      req.user.role,
      complaintId,
    );
  }

  @Get(':id')
  async getEvidence(@Req() req: any, @Param('id') id: string) {
    return this.evidenceService.getEvidence(req.user.userId, req.user.role, id);
  }

  @Delete(':id')
  async deleteEvidence(@Req() req: any, @Param('id') id: string) {
    return this.evidenceService.deleteEvidence(
      req.user.userId,
      req.user.role,
      id,
    );
  }
}
