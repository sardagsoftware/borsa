import { z } from 'zod';

/**
 * White-Hat: Proof verification response schema
 */
export const ProofResponseSchema = z.object({
  txId: z.string(),
  verified: z.boolean(),
  jws: z.string(),
  merkleRoot: z.string(),
  timestamp: z.string(), // ISO 8601
  payload: z.object({
    walletId: z.string(),
    type: z.string(),
    metric: z.string(),
    amount: z.number(),
    ethicsScore: z.number(),
    impactScore: z.number(),
  }),
  // RFC3161 timestamp (if available)
  rfc3161Verified: z.boolean().optional(),
  arpId: z.string().optional(), // Audit record pointer
});

export type ProofResponseDto = z.infer<typeof ProofResponseSchema>;

/**
 * White-Hat: Safe serialization
 */
export function serializeProof(proof: any): ProofResponseDto {
  return {
    txId: proof.txId,
    verified: proof.verified,
    jws: proof.jws,
    merkleRoot: proof.merkleRoot,
    timestamp: proof.createdAt.toISOString(),
    payload: proof.payload || {},
    rfc3161Verified: proof.tsr ? true : false,
    arpId: proof.arpId,
  };
}
