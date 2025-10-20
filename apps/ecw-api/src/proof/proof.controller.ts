import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ProofService } from './proof.service';
import {
  VerifyProofDto,
  validateVerifyProof,
} from './dto/verify-proof.dto';
import { ProofResponseDto } from './dto/proof-response.dto';

/**
 * ECW v7.3 - Proof Controller
 * White-Hat REST API:
 * - Proof verification endpoint
 * - JWS signature verification
 * - Merkle root verification
 * - RFC3161 timestamp verification
 */
@Controller('proof')
export class ProofController {
  private readonly logger = new Logger(ProofController.name);

  constructor(private readonly proofService: ProofService) {}

  /**
   * POST /v7.3/ecw/proof/verify
   * Verify Proof-of-Impact for a transaction
   *
   * White-Hat:
   * - Verifies JWS signature (ES256)
   * - Verifies Merkle root
   * - Verifies RFC3161 timestamp (if present)
   * - Returns verification result
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyProof(@Body() body: unknown): Promise<{
    success: boolean;
    data: ProofResponseDto;
  }> {
    this.logger.log('POST /proof/verify');

    // Zod validation
    const dto: VerifyProofDto = validateVerifyProof(body);

    const proof = await this.proofService.verifyProof(dto.txId);

    return {
      success: true,
      data: proof,
    };
  }

  /**
   * GET /v7.3/ecw/proof/:txId
   * Get proof by transaction ID
   *
   * White-Hat:
   * - Returns 404 if not found
   * - Returns proof details (JWS, Merkle, TSR status)
   */
  @Get(':txId')
  async getProofByTxId(@Param('txId') txId: string): Promise<{
    success: boolean;
    data: ProofResponseDto;
  }> {
    this.logger.log(`GET /proof/${txId}`);

    const proof = await this.proofService.getProofByTxId(txId);

    return {
      success: true,
      data: proof,
    };
  }

  /**
   * GET /v7.3/ecw/proof/stats
   * Get proof statistics
   *
   * White-Hat:
   * - Aggregated metrics (no PII)
   * - Total proofs, verified proofs, proofs with timestamp
   */
  @Get('stats')
  async getProofStats(): Promise<{
    success: boolean;
    data: {
      totalProofs: number;
      verifiedProofs: number;
      proofsWithTimestamp: number;
    };
  }> {
    this.logger.log('GET /proof/stats');

    const stats = await this.proofService.getProofStats();

    return {
      success: true,
      data: stats,
    };
  }
}
