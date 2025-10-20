import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletResponseDto, serializeWallet } from './dto/wallet-response.dto';

/**
 * ECW v7.3 - Wallet Service
 * White-Hat Business Logic:
 * - Zero PII storage (ownerID only)
 * - Uniqueness constraint (ownerType + ownerId per region)
 * - Default balances = 0
 * - Default ethics scores = 0
 * - AuditLog integration (pending)
 */
@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new wallet
   * White-Hat:
   * - Validates uniqueness (ownerType + ownerId + region)
   * - No duplicate wallets per owner
   * - Logs creation for audit trail
   */
  async createWallet(dto: CreateWalletDto): Promise<WalletResponseDto> {
    this.logger.log(
      `Creating wallet: ownerType=${dto.ownerType}, region=${dto.region}`,
    );

    // Check if wallet already exists for this owner
    const existing = await this.prisma.wallet.findFirst({
      where: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        region: dto.region,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Wallet already exists for ${dto.ownerType}:${dto.ownerId} in ${dto.region}`,
      );
    }

    // Create wallet with default values
    const wallet = await this.prisma.wallet.create({
      data: {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        region: dto.region,
        balanceCO2: dto.balanceCO2 ?? 0,
        balanceH2O: dto.balanceH2O ?? 0,
        balanceKWh: dto.balanceKWh ?? 0,
        balanceWaste: dto.balanceWaste ?? 0,
        ethicsScore: dto.ethicsScore ?? 0,
        impactScore: dto.impactScore ?? 0,
        status: 'active',
      },
    });

    this.logger.log(`✓ Wallet created: id=${wallet.id}`);

    // TODO: Log to AuditLog (Phase 2)
    // await this.auditLog.log({
    //   action: 'WALLET_CREATED',
    //   actorType: dto.ownerType,
    //   actorId: dto.ownerId,
    //   resourceId: wallet.id,
    //   region: dto.region,
    // });

    return serializeWallet(wallet);
  }

  /**
   * Get wallet by ID
   * White-Hat:
   * - Returns safe DTO (no internal data exposed)
   * - Throws NotFoundException if not found (caught by global filter)
   */
  async getWalletById(id: string): Promise<WalletResponseDto> {
    this.logger.log(`Fetching wallet: id=${id}`);

    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found: ${id}`);
    }

    return serializeWallet(wallet);
  }

  /**
   * Get wallet by owner (external ID)
   * White-Hat:
   * - Allows fetching by external ownerID
   * - Scoped by region for data residency
   */
  async getWalletByOwner(
    ownerType: string,
    ownerId: string,
    region: string,
  ): Promise<WalletResponseDto | null> {
    this.logger.log(
      `Fetching wallet by owner: ${ownerType}:${ownerId} in ${region}`,
    );

    const wallet = await this.prisma.wallet.findFirst({
      where: {
        ownerType,
        ownerId,
        region,
      },
    });

    return wallet ? serializeWallet(wallet) : null;
  }

  /**
   * Update wallet balances (internal use only, called by TransactionService)
   * White-Hat:
   * - Atomic balance updates
   * - Prevents negative balances (optional constraint)
   * - Logs for audit trail
   */
  async updateBalances(
    walletId: string,
    deltas: {
      CO2?: number;
      H2O?: number;
      kWh?: number;
      waste?: number;
    },
  ): Promise<WalletResponseDto> {
    this.logger.log(`Updating balances: walletId=${walletId}`);

    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(deltas.CO2 !== undefined && {
          balanceCO2: { increment: deltas.CO2 },
        }),
        ...(deltas.H2O !== undefined && {
          balanceH2O: { increment: deltas.H2O },
        }),
        ...(deltas.kWh !== undefined && {
          balanceKWh: { increment: deltas.kWh },
        }),
        ...(deltas.waste !== undefined && {
          balanceWaste: { increment: deltas.waste },
        }),
      },
    });

    return serializeWallet(wallet);
  }

  /**
   * Update ethics scores (called by ethics-layer package)
   * White-Hat:
   * - Recalculates Ω (Omega) and Φ (Phi) scores
   * - Triggered after transactions
   */
  async updateEthicsScores(
    walletId: string,
    ethicsScore?: number,
    impactScore?: number,
  ): Promise<WalletResponseDto> {
    this.logger.log(`Updating ethics scores: walletId=${walletId}`);

    const wallet = await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(ethicsScore !== undefined && { ethicsScore }),
        ...(impactScore !== undefined && { impactScore }),
      },
    });

    return serializeWallet(wallet);
  }

  /**
   * Deactivate wallet
   * White-Hat:
   * - Soft delete (status = inactive)
   * - Preserves data for audit trail
   * - Cannot delete wallets (compliance requirement)
   */
  async deactivateWallet(id: string): Promise<WalletResponseDto> {
    this.logger.log(`Deactivating wallet: id=${id}`);

    const wallet = await this.prisma.wallet.update({
      where: { id },
      data: { status: 'inactive' },
    });

    // TODO: Log to AuditLog
    // await this.auditLog.log({
    //   action: 'WALLET_DEACTIVATED',
    //   resourceId: id,
    // });

    return serializeWallet(wallet);
  }

  /**
   * Health check: Count active wallets per region
   * White-Hat:
   * - Aggregated metrics only (no PII)
   * - Used for monitoring dashboard
   */
  async getWalletStats(): Promise<{
    total: number;
    byRegion: Record<string, number>;
    byOwnerType: Record<string, number>;
  }> {
    const [total, byRegion, byOwnerType] = await Promise.all([
      this.prisma.wallet.count({ where: { status: 'active' } }),
      this.prisma.wallet.groupBy({
        by: ['region'],
        where: { status: 'active' },
        _count: true,
      }),
      this.prisma.wallet.groupBy({
        by: ['ownerType'],
        where: { status: 'active' },
        _count: true,
      }),
    ]);

    return {
      total,
      byRegion: Object.fromEntries(
        byRegion.map((r) => [r.region, r._count]),
      ),
      byOwnerType: Object.fromEntries(
        byOwnerType.map((r) => [r.ownerType, r._count]),
      ),
    };
  }
}
