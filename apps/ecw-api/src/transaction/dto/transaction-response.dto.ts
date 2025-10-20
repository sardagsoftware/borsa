import { z } from 'zod';

/**
 * White-Hat: Transaction response schema
 * Safe serialization (no sensitive internal data)
 */
export const TransactionResponseSchema = z.object({
  id: z.string().cuid(),
  walletId: z.string(),
  type: z.string(),
  metric: z.string(),
  amount: z.number(),
  reason: z.string(),
  source: z.string(),
  ethicsScore: z.number(),
  impactScore: z.number(),
  intentScore: z.number().nullable(),
  proofJws: z.string(),
  externalRef: z.string().nullable(),
  createdAt: z.date(),
});

export type TransactionResponseDto = z.infer<typeof TransactionResponseSchema>;

/**
 * White-Hat: Safe serialization
 */
export function serializeTransaction(transaction: any): TransactionResponseDto {
  return {
    id: transaction.id,
    walletId: transaction.walletId,
    type: transaction.type,
    metric: transaction.metric,
    amount: transaction.amount,
    reason: transaction.reason,
    source: transaction.source,
    ethicsScore: transaction.ethicsScore,
    impactScore: transaction.impactScore,
    intentScore: transaction.intentScore,
    proofJws: transaction.proofJws,
    externalRef: transaction.externalRef,
    createdAt: transaction.createdAt,
  };
}
