/**
 * LYDIAN-IQ TRUST LAYER
 *
 * Purpose: Explainable AI + cryptographically signed operations
 * Features:
 * - SHAP-style feature importance for all critical decisions
 * - Ed25519 signature verification for operations
 * - Evidence pack generation (Merkle proofs + attestation)
 * - Compliance: EU AI Act explainability requirements
 *
 * Security: All critical operations are signed and verifiable
 */

export * from './types';
export * from './explainer';
export * from './op-signer';
export * from './evidence-pack';

export const VERSION = '1.0.0';
