import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../common/prisma.service';
import { WalletModule } from '../wallet/wallet.module';
import { ProofModule } from '../proof/proof.module';

/**
 * ECW v7.3 - Transaction Module
 * - Transaction logging (debit/credit)
 * - Ethics scoring (Ω/Φ)
 * - Proof reference (JWS)
 * - Wallet balance updates
 */
@Module({
  imports: [WalletModule, ProofModule], // Import WalletModule + ProofModule
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService],
  exports: [TransactionService], // For use in other modules
})
export class TransactionModule {}
