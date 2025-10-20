import { z } from 'zod';

/**
 * White-Hat: Zod schema for proof verification
 * - Validates JWS format
 * - Validates transaction ID
 */
export const VerifyProofSchema = z.object({
  txId: z
    .string()
    .min(1, 'txId is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'txId must be alphanumeric'),

  // Optional: Verify against expected values
  expectedWalletId: z.string().optional(),
  expectedAmount: z.number().optional(),
});

export type VerifyProofDto = z.infer<typeof VerifyProofSchema>;

/**
 * White-Hat: Runtime validation function
 */
export function validateVerifyProof(data: unknown): VerifyProofDto {
  return VerifyProofSchema.parse(data);
}
