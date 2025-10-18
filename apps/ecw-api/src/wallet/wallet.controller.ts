import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  Logger,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
  CreateWalletDto,
  validateCreateWallet,
} from './dto/create-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';

/**
 * ECW v7.3 - Wallet Controller
 * White-Hat REST API:
 * - Zod validation on all inputs
 * - Safe error responses (global exception filter)
 * - Rate limiting (global throttler guard)
 * - Audit logging (global interceptor)
 */
@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * POST /v7.3/ecw/wallet/create
   * Create new wallet
   *
   * White-Hat:
   * - Validates input with Zod
   * - Returns 409 if wallet exists
   * - Returns 201 on success
   * - No PII in request/response
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Body() body: unknown): Promise<{
    success: boolean;
    data: WalletResponseDto;
  }> {
    this.logger.log('POST /wallet/create');

    // Zod validation (throws ZodError if invalid)
    const dto: CreateWalletDto = validateCreateWallet(body);

    const wallet = await this.walletService.createWallet(dto);

    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * GET /v7.3/ecw/wallet/:id
   * Get wallet by ID
   *
   * White-Hat:
   * - Returns 404 if not found
   * - Returns 200 with safe DTO
   */
  @Get(':id')
  async getWalletById(@Param('id') id: string): Promise<{
    success: boolean;
    data: WalletResponseDto;
  }> {
    this.logger.log(`GET /wallet/${id}`);

    const wallet = await this.walletService.getWalletById(id);

    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * GET /v7.3/ecw/wallet/owner?ownerType=...&ownerId=...&region=...
   * Get wallet by external owner ID
   *
   * White-Hat:
   * - Allows fetching by ownerID (external reference)
   * - Scoped by region (data residency)
   * - Returns 404 if not found
   */
  @Get('owner/lookup')
  async getWalletByOwner(
    @Query('ownerType') ownerType: string,
    @Query('ownerId') ownerId: string,
    @Query('region') region: string,
  ): Promise<{
    success: boolean;
    data: WalletResponseDto | null;
  }> {
    this.logger.log(
      `GET /wallet/owner/lookup?ownerType=${ownerType}&ownerId=${ownerId}&region=${region}`,
    );

    const wallet = await this.walletService.getWalletByOwner(
      ownerType,
      ownerId,
      region,
    );

    return {
      success: true,
      data: wallet,
    };
  }

  /**
   * GET /v7.3/ecw/wallet/stats
   * Get aggregated wallet statistics
   *
   * White-Hat:
   * - No PII (aggregated counts only)
   * - Used for monitoring dashboard
   */
  @Get('stats')
  async getWalletStats(): Promise<{
    success: boolean;
    data: {
      total: number;
      byRegion: Record<string, number>;
      byOwnerType: Record<string, number>;
    };
  }> {
    this.logger.log('GET /wallet/stats');

    const stats = await this.walletService.getWalletStats();

    return {
      success: true,
      data: stats,
    };
  }
}
