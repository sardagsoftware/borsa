/**
 * TRUST LAYER TYPES
 *
 * Type-safe interfaces for explainability and signed operations
 */

import { z } from 'zod';

/**
 * Feature importance (SHAP-style)
 */
export const FeatureImportance = z.object({
  feature_name: z.string(),
  importance: z.number().min(-1).max(1), // Normalized SHAP value
  feature_value: z.union([z.string(), z.number(), z.boolean()]),
  contribution_direction: z.enum(['positive', 'negative', 'neutral']),
});
export type FeatureImportance = z.infer<typeof FeatureImportance>;

/**
 * Explanation for a decision
 */
export const Explanation = z.object({
  decision_id: z.string(),
  decision_type: z.enum([
    'pricing',
    'promotion',
    'routing',
    'fraud_detection',
    'recommendation',
    'economy_optimization',
  ]),
  model_name: z.string(),
  model_version: z.string(),
  prediction: z.union([z.string(), z.number(), z.boolean()]),
  confidence: z.number().min(0).max(1),
  feature_importances: z.array(FeatureImportance),
  natural_language_summary: z.string(),
  timestamp: z.string().datetime(),
  explainability_method: z.enum(['shap', 'lime', 'attention', 'rule_based']).default('shap'),
});
export type Explanation = z.infer<typeof Explanation>;

/**
 * Signed operation request
 */
export const SignedOperationRequest = z.object({
  operation_type: z.enum([
    'price_update',
    'promotion_activation',
    'refund_approval',
    'data_export',
    'model_deployment',
  ]),
  payload: z.record(z.any()),
  actor: z.string(), // User ID or system identifier
  timestamp: z.string().datetime(),
  nonce: z.string().optional(), // Prevent replay attacks
});
export type SignedOperationRequest = z.infer<typeof SignedOperationRequest>;

/**
 * Signed operation
 */
export const SignedOperation = z.object({
  operation_id: z.string().uuid(),
  operation_type: z.string(),
  payload: z.record(z.any()),
  actor: z.string(),
  timestamp: z.string().datetime(),
  signature: z.string(), // Ed25519 signature (base64)
  public_key: z.string(), // Ed25519 public key (base64)
  algorithm: z.literal('Ed25519'),
});
export type SignedOperation = z.infer<typeof SignedOperation>;

/**
 * Signature verification result
 */
export const VerificationResult = z.object({
  valid: z.boolean(),
  operation_id: z.string().uuid(),
  verified_at: z.string().datetime(),
  public_key: z.string(),
  error_message: z.string().optional(),
});
export type VerificationResult = z.infer<typeof VerificationResult>;

/**
 * Merkle tree node
 */
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string;
}

/**
 * Merkle proof
 */
export const MerkleProof = z.object({
  leaf_hash: z.string(),
  root_hash: z.string(),
  proof_path: z.array(
    z.object({
      hash: z.string(),
      position: z.enum(['left', 'right']),
    })
  ),
  leaf_index: z.number().int().min(0),
});
export type MerkleProof = z.infer<typeof MerkleProof>;

/**
 * Evidence pack (exportable audit trail)
 */
export const EvidencePack = z.object({
  pack_id: z.string().uuid(),
  decision_id: z.string(),
  created_at: z.string().datetime(),
  includes: z.object({
    explanation: Explanation.optional(),
    signed_operation: SignedOperation.optional(),
    merkle_proof: MerkleProof.optional(),
    attestation_logs: z.array(z.record(z.any())).optional(),
  }),
  integrity_hash: z.string(), // SHA-256 of entire pack
  format: z.enum(['json', 'zip']),
});
export type EvidencePack = z.infer<typeof EvidencePack>;

/**
 * Key pair for Ed25519 signing
 */
export interface KeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

/**
 * Attestation log entry
 */
export interface AttestationLogEntry {
  action_hash: string;
  timestamp: string;
  actor: string;
  metadata?: Record<string, any>;
}
