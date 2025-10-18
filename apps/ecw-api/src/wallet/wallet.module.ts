import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from '../common/prisma.service';

/**
 * ECW v7.3 - Wallet Module
 * Manages ethical climate wallets with zero PII
 * - Multi-metric tracking (CO2, H2O, kWh, Waste)
 * - Ethics scoring (Ω/Φ)
 * - Data residency enforcement (EU/TR/US)
 */
@Module({
  controllers: [WalletController],
  providers: [WalletService, PrismaService],
  exports: [WalletService], // For use in Transaction module
})
export class WalletModule {}
