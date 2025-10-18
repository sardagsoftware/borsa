import { z } from 'zod';

/**
 * White-Hat: Zod schema for transaction logging
 * - Validates transaction type (debit/credit)
 * - Validates metric (CO2, H2O, kWh, Waste)
 * - Validates amount (must be positive)
 * - Requires reason (audit trail)
 * - Optional source tracking
 */
export const LogTransactionSchema = z.object({
  walletId: z
    .string()
    .min(1, 'walletId is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'walletId must be alphanumeric'),

  type: z.enum(['debit', 'credit'], {
    errorMap: () => ({ message: 'type must be debit or credit' }),
  }),

  metric: z.enum(['CO2', 'H2O', 'kWh', 'Waste'], {
    errorMap: () => ({ message: 'metric must be CO2, H2O, kWh, or Waste' }),
  }),

  amount: z
    .number()
    .positive('amount must be positive')
    .max(1000000, 'amount exceeds maximum allowed'),

  reason: z
    .string()
    .min(3, 'reason is required (min 3 chars)')
    .max(500, 'reason too long (max 500 chars)'),

  source: z
    .enum(['manual', 'nico', 'irssa', 'tfe', 'qee', 'ctpeh', 'partner'])
    .default('manual'),

  // Optional: Intent score (USK - User Sentiment Kinetics)
  intentScore: z.number().min(0).max(100).optional(),

  // Optional: External reference ID
  externalRef: z.string().max(255).optional(),
});

export type LogTransactionDto = z.infer<typeof LogTransactionSchema>;

/**
 * White-Hat: Runtime validation function
 */
export function validateLogTransaction(data: unknown): LogTransactionDto {
  return LogTransactionSchema.parse(data);
}
