import { z } from 'zod';

/**
 * White-Hat: Wallet response schema (no internal IDs exposed unnecessarily)
 */
export const WalletResponseSchema = z.object({
  id: z.string().cuid(),
  ownerType: z.string(),
  ownerId: z.string(),
  region: z.string(),
  balanceCO2: z.number(),
  balanceH2O: z.number(),
  balanceKWh: z.number(),
  balanceWaste: z.number(),
  ethicsScore: z.number(),
  impactScore: z.number(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletResponseDto = z.infer<typeof WalletResponseSchema>;

/**
 * White-Hat: Safe serialization (removes sensitive fields if any)
 * Currently no sensitive fields, but future-proofing
 */
export function serializeWallet(wallet: any): WalletResponseDto {
  return {
    id: wallet.id,
    ownerType: wallet.ownerType,
    ownerId: wallet.ownerId,
    region: wallet.region,
    balanceCO2: wallet.balanceCO2,
    balanceH2O: wallet.balanceH2O,
    balanceKWh: wallet.balanceKWh,
    balanceWaste: wallet.balanceWaste,
    ethicsScore: wallet.ethicsScore,
    impactScore: wallet.impactScore,
    status: wallet.status,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}
