import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  LogTransactionDto,
  validateLogTransaction,
} from './dto/log-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

/**
 * ECW v7.3 - Transaction Controller
 * White-Hat REST API:
 * - Zod validation on all inputs
 * - Safe error responses (global exception filter)
 * - Rate limiting (global throttler guard)
 * - Audit logging (global interceptor)
 */
@Controller('tx')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  /**
   * POST /v7.3/ecw/tx/log
   * Log a new transaction (debit or credit)
   *
   * White-Hat:
   * - Validates input with Zod
   * - Returns 404 if wallet not found
   * - Returns 201 on success
   * - Updates wallet balances atomically
   * - Calculates ethics scores (Ω/Φ)
   * - Generates proof JWS
   */
  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  async logTransaction(@Body() body: unknown): Promise<{
    success: boolean;
    data: TransactionResponseDto;
  }> {
    this.logger.log('POST /tx/log');

    // Zod validation
    const dto: LogTransactionDto = validateLogTransaction(body);

    const transaction = await this.transactionService.logTransaction(dto);

    return {
      success: true,
      data: transaction,
    };
  }

  /**
   * GET /v7.3/ecw/tx/history/:walletId
   * Get transaction history for a wallet
   *
   * White-Hat:
   * - Returns 404 if wallet not found
   * - Paginated (limit + offset)
   * - Sorted by createdAt DESC
   */
  @Get('history/:walletId')
  async getTransactionHistory(
    @Param('walletId') walletId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{
    success: boolean;
    data: TransactionResponseDto[];
    pagination: {
      limit: number;
      offset: number;
    };
  }> {
    this.logger.log(`GET /tx/history/${walletId}`);

    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    const transactions = await this.transactionService.getTransactionHistory(
      walletId,
      parsedLimit,
      parsedOffset,
    );

    return {
      success: true,
      data: transactions,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
      },
    };
  }

  /**
   * GET /v7.3/ecw/tx/:id
   * Get transaction by ID
   *
   * White-Hat:
   * - Returns 404 if not found
   * - Returns 200 with safe DTO
   */
  @Get(':id')
  async getTransactionById(@Param('id') id: string): Promise<{
    success: boolean;
    data: TransactionResponseDto;
  }> {
    this.logger.log(`GET /tx/${id}`);

    const transaction = await this.transactionService.getTransactionById(id);

    return {
      success: true,
      data: transaction,
    };
  }

  /**
   * GET /v7.3/ecw/tx/stats/:walletId
   * Get transaction statistics for a wallet
   *
   * White-Hat:
   * - Aggregated metrics (no PII)
   * - Total credits/debits
   * - Breakdown by metric
   * - Average ethics scores
   */
  @Get('stats/:walletId')
  async getWalletTransactionStats(@Param('walletId') walletId: string): Promise<{
    success: boolean;
    data: {
      totalTransactions: number;
      totalCredits: number;
      totalDebits: number;
      byMetric: Record<string, { credits: number; debits: number }>;
      avgEthicsScore: number;
      avgImpactScore: number;
    };
  }> {
    this.logger.log(`GET /tx/stats/${walletId}`);

    const stats = await this.transactionService.getWalletTransactionStats(
      walletId,
    );

    return {
      success: true,
      data: stats,
    };
  }
}
