// LCI API - Brands Controller
// White-hat: Brand panel endpoints

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import { BrandsService } from './brands.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  /**
   * Public endpoint to list brands for complaint form
   * White-hat: No authentication required for brand list
   */
  @Get()
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  async listPublicBrands(@Query('status') status?: string) {
    return this.brandsService.listPublicBrands(status);
  }

  @Post('responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 responses per minute
  async createResponse(@Req() req: any, @Body() dto: CreateResponseDto) {
    return this.brandsService.createResponse(
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Get(':brandId/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async getBrandDashboard(@Req() req: any, @Param('brandId') brandId: string) {
    return this.brandsService.getBrandDashboard(brandId, req.user.role);
  }

  @Get(':brandId/complaints')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async listBrandComplaints(
    @Req() req: any,
    @Param('brandId') brandId: string,
  ) {
    return this.brandsService.listBrandComplaints(brandId, req.user.role);
  }

  @Get('complaints/:complaintId/responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN')
  async getComplaintResponses(
    @Req() req: any,
    @Param('complaintId') complaintId: string,
  ) {
    return this.brandsService.getComplaintResponses(
      complaintId,
      req.user.role,
    );
  }
}
