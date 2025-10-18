import { Module } from '@nestjs/common';
import { ProofController } from './proof.controller';
import { ProofService } from './proof.service';
import { PrismaService } from '../common/prisma.service';

/**
 * ECW v7.3 - Proof Module
 * - JWS signing (ES256)
 * - Merkle tree construction
 * - RFC3161 timestamping (TSA)
 * - Proof verification
 */
@Module({
  controllers: [ProofController],
  providers: [ProofService, PrismaService],
  exports: [ProofService], // For use in Transaction module
})
export class ProofModule {}
