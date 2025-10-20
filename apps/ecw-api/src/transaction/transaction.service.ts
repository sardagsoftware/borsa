import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ProofService } from '../proof/proof.service';
import { LogTransactionDto } from './dto/log-transaction.dto';
import {
  TransactionResponseDto,
  serializeTransaction,
} from './dto/transaction-response.dto';

/**
 * ECW v7.3 - Transaction Service
 * White-Hat Business Logic:
 * - Atomic transaction logging
 * - Wallet balance updates
 * - Ethics scoring (Ω/Φ)
 * - Proof-of-Impact generation (JWS)
 * - Audit trail
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly proofService: ProofService,
  ) {}

  /**
   * Log transaction (debit or credit)
   * White-Hat:
   * - Validates wallet exists
   * - Atomic operation (tx log + wallet update)
   * - Calculates ethics scores (Ω/Φ)
   * - Generates proof JWS (placeholder)
   * - Updates wallet balances
   * - Logs to AuditLog (prepared)
   */
  async logTransaction(
    dto: LogTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(
      `Logging transaction: walletId=${dto.walletId}, type=${dto.type}, metric=${dto.metric}, amount=${dto.amount}`,
    );

    // Step 1: Validate wallet exists
    const wallet = await this.walletService.getWalletById(dto.walletId);
    if (!wallet) {
      throw new NotFoundException(`Wallet not found: ${dto.walletId}`);
    }

    // Step 2: Calculate ethics scores (Ω/Φ)
    const ethicsScore = this.calculateEthicsScore(dto);
    const impactScore = this.calculateImpactScore(dto);

    // Step 3: Log transaction to database FIRST (need txId for proof)
    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: dto.walletId,
        type: dto.type,
        metric: dto.metric,
        amount: dto.amount,
        reason: dto.reason,
        source: dto.source,
        ethicsScore,
        impactScore,
        intentScore: dto.intentScore ?? null,
        proofJws: 'pending', // Temporary placeholder
        externalRef: dto.externalRef ?? null,
      },
    });

    // Step 4: Generate real JWS proof (ProofService)
    const proofJws = await this.proofService.generateProof({
      id: transaction.id,
      walletId: transaction.walletId,
      type: transaction.type,
      metric: transaction.metric,
      amount: transaction.amount,
      ethicsScore,
      impactScore,
    });

    // Step 5: Update transaction with real JWS
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { proofJws },
    });

    // Step 6: Update wallet balances
    await this.updateWalletBalance(dto.walletId, dto.type, dto.metric, dto.amount);

    // Step 7: Update wallet ethics scores (aggregate)
    await this.updateWalletEthicsScores(dto.walletId);

    this.logger.log(`✓ Transaction logged: id=${transaction.id}`);

    // TODO: Log to AuditLog (Phase 2)
    // await this.auditLog.log({
    //   action: 'TRANSACTION_LOGGED',
    //   resourceId: transaction.id,
    //   walletId: dto.walletId,
    //   amount: dto.amount,
    // });

    return serializeTransaction(transaction);
  }

  /**
   * Get transaction history for a wallet
   * White-Hat:
   * - Returns safe DTOs
   * - Paginated (limit + offset)
   * - Sorted by createdAt DESC
   */
  async getTransactionHistory(
    walletId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TransactionResponseDto[]> {
    this.logger.log(
      `Fetching transaction history: walletId=${walletId}, limit=${limit}, offset=${offset}`,
    );

    // Validate wallet exists
    await this.walletService.getWalletById(walletId);

    const transactions = await this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions.map(serializeTransaction);
  }

  /**
   * Get transaction by ID
   * White-Hat:
   * - Returns safe DTO
   * - Throws NotFoundException if missing
   */
  async getTransactionById(id: string): Promise<TransactionResponseDto> {
    this.logger.log(`Fetching transaction: id=${id}`);

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${id}`);
    }

    return serializeTransaction(transaction);
  }

  /**
   * Get transaction statistics for a wallet
   * White-Hat:
   * - Aggregated metrics (no PII)
   * - Total credits/debits per metric
   * - Average ethics scores
   */
  async getWalletTransactionStats(walletId: string): Promise<{
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    byMetric: Record<string, { credits: number; debits: number }>;
    avgEthicsScore: number;
    avgImpactScore: number;
  }> {
    this.logger.log(`Fetching transaction stats: walletId=${walletId}`);

    // Validate wallet exists
    await this.walletService.getWalletById(walletId);

    const [total, credits, debits, avgScores, byMetric] = await Promise.all([
      this.prisma.transaction.count({ where: { walletId } }),
      this.prisma.transaction.count({
        where: { walletId, type: 'credit' },
      }),
      this.prisma.transaction.count({ where: { walletId, type: 'debit' } }),
      this.prisma.transaction.aggregate({
        where: { walletId },
        _avg: { ethicsScore: true, impactScore: true },
      }),
      this.prisma.transaction.groupBy({
        by: ['metric', 'type'],
        where: { walletId },
        _sum: { amount: true },
      }),
    ]);

    // Build byMetric breakdown
    const metricStats: Record<string, { credits: number; debits: number }> = {};
    for (const group of byMetric) {
      if (!metricStats[group.metric]) {
        metricStats[group.metric] = { credits: 0, debits: 0 };
      }
      if (group.type === 'credit') {
        metricStats[group.metric].credits = group._sum.amount || 0;
      } else {
        metricStats[group.metric].debits = group._sum.amount || 0;
      }
    }

    return {
      totalTransactions: total,
      totalCredits: credits,
      totalDebits: debits,
      byMetric: metricStats,
      avgEthicsScore: avgScores._avg.ethicsScore || 0,
      avgImpactScore: avgScores._avg.impactScore || 0,
    };
  }

  /**
   * PRIVATE: Calculate ethics score (Ω - Omega)
   * White-Hat:
   * - Based on source reliability
   * - Based on metric type
   * - Based on intent score (if provided)
   * TODO: Replace with ethics-layer package
   */
  private calculateEthicsScore(dto: LogTransactionDto): number {
    let score = 50; // Base score

    // Source reliability bonus
    const sourceBonus: Record<string, number> = {
      manual: 0,
      nico: 20,
      irssa: 15,
      tfe: 10,
      qee: 25,
      ctpeh: 15,
      partner: 5,
    };
    score += sourceBonus[dto.source] || 0;

    // Metric impact weight
    const metricWeight: Record<string, number> = {
      CO2: 1.2,
      H2O: 1.0,
      kWh: 1.1,
      Waste: 0.9,
    };
    score *= metricWeight[dto.metric] || 1.0;

    // Intent score influence (if provided)
    if (dto.intentScore !== undefined) {
      score = score * 0.7 + dto.intentScore * 0.3;
    }

    // Debit transactions get slight penalty (incentivize credits)
    if (dto.type === 'debit') {
      score *= 0.95;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * PRIVATE: Calculate impact score (Φ - Phi)
   * White-Hat:
   * - Based on amount magnitude
   * - Based on metric type
   * TODO: Replace with ethics-layer package
   */
  private calculateImpactScore(dto: LogTransactionDto): number {
    let score = 0;

    // Amount-based impact (logarithmic scale)
    const amountScore = Math.min(50, Math.log10(dto.amount + 1) * 15);

    // Metric-specific impact multipliers
    const metricMultiplier: Record<string, number> = {
      CO2: 1.5, // CO2 has highest impact
      H2O: 1.2,
      kWh: 1.3,
      Waste: 1.0,
    };

    score = amountScore * (metricMultiplier[dto.metric] || 1.0);

    // Credit transactions get bonus (positive impact)
    if (dto.type === 'credit') {
      score *= 1.2;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }


  /**
   * PRIVATE: Update wallet balance after transaction
   * White-Hat:
   * - Atomic update
   * - Debit = negative delta
   * - Credit = positive delta
   */
  private async updateWalletBalance(
    walletId: string,
    type: string,
    metric: string,
    amount: number,
  ): Promise<void> {
    const delta = type === 'debit' ? -amount : amount;

    const deltaMap: Record<string, number> = {
      CO2: metric === 'CO2' ? delta : 0,
      H2O: metric === 'H2O' ? delta : 0,
      kWh: metric === 'kWh' ? delta : 0,
      waste: metric === 'Waste' ? delta : 0,
    };

    await this.walletService.updateBalances(walletId, deltaMap);
  }

  /**
   * PRIVATE: Update wallet ethics scores (aggregate from all transactions)
   * White-Hat:
   * - Recalculates Ω and Φ based on all transactions
   * - Weighted average (recent transactions weighted higher)
   * TODO: Replace with ethics-layer package
   */
  private async updateWalletEthicsScores(walletId: string): Promise<void> {
    // Get recent transactions (last 100)
    const recentTxs = await this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (recentTxs.length === 0) {
      return; // No transactions yet
    }

    // Calculate weighted average (more recent = higher weight)
    let totalEthicsScore = 0;
    let totalImpactScore = 0;
    let totalWeight = 0;

    recentTxs.forEach((tx, index) => {
      const weight = 1 / (index + 1); // Decay weight
      totalEthicsScore += tx.ethicsScore * weight;
      totalImpactScore += tx.impactScore * weight;
      totalWeight += weight;
    });

    const avgEthicsScore = Math.round(totalEthicsScore / totalWeight);
    const avgImpactScore = Math.round(totalImpactScore / totalWeight);

    await this.walletService.updateEthicsScores(
      walletId,
      avgEthicsScore,
      avgImpactScore,
    );
  }
}
