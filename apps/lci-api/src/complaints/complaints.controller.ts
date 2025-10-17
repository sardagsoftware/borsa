// LCI API - Complaints Controller
// White-hat: REST endpoints with guards and validation

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { TransitionStateDto } from './dto/transition-state.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 complaints per minute
  async create(@Req() req: any, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.complaintsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.complaintsService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.update(
      id,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Post(':id/transition')
  @Roles('BRAND_AGENT', 'MODERATOR', 'ADMIN') // Elevated permissions required
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 transitions per minute
  async transitionState(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: TransitionStateDto,
  ) {
    return this.complaintsService.transitionState(
      id,
      req.user.userId,
      req.user.role,
      dto,
    );
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.complaintsService.delete(id, req.user.userId, req.user.role);
  }
}
