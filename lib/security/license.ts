/**
 * LYDIAN-IQ LICENSE VERIFICATION
 *
 * Purpose: Ed25519 signature verification for license enforcement
 * Compliance: IP Protection, White-Hat only
 * Algorithm: Ed25519 (Curve25519)
 *
 * License Format:
 * {
 *   "org": "acme-corp",
 *   "features": ["commerce", "logistics", "ai"],
 *   "exp": "2026-01-01T00:00:00Z",
 *   "issued_at": "2025-01-01T00:00:00Z",
 *   "grace_period_seconds": 2592000
 * }
 *
 * Signature: Ed25519(SHA512(licensePayload), privateKey)
 * Verification: Ed25519Verify(signature, publicKey, SHA512(licensePayload))
 */

import crypto from 'crypto';

/**
 * License payload structure
 */
export interface LicensePayload {
  org: string;
  features: string[];
  exp: string; // ISO 8601 expiration
  issued_at: string; // ISO 8601
  grace_period_seconds: number; // Grace period after expiration
  max_connectors?: number;
  max_requests_per_day?: number;
}

/**
 * License verification result
 */
export interface LicenseVerificationResult {
  valid: boolean;
  expired: boolean;
  in_grace_period: boolean;
  features_enabled: string[];
  error?: string;
  audit_log: {
    verified_at: string;
    org: string;
    status: 'valid' | 'expired' | 'invalid_signature' | 'malformed';
  };
}

/**
 * License verification options
 */
export interface LicenseVerifyOptions {
  licensePayload: LicensePayload;
  signature: string; // Base64-encoded Ed25519 signature
  publicKey: string; // Base64-encoded Ed25519 public key (32 bytes)
  currentTime?: Date; // For testing
}

/**
 * Verify Ed25519 license signature
 *
 * @param options - License verification options
 * @returns Verification result with audit log
 *
 * @example
 * ```typescript
 * const result = verifyLicense({
 *   licensePayload: {
 *     org: "acme-corp",
 *     features: ["commerce", "logistics"],
 *     exp: "2026-01-01T00:00:00Z",
 *     issued_at: "2025-01-01T00:00:00Z",
 *     grace_period_seconds: 2592000
 *   },
 *   signature: "base64_signature_here",
 *   publicKey: "base64_public_key_here"
 * });
 *
 * if (!result.valid) {
 *   throw new Error(`License verification failed: ${result.error}`);
 * }
 * ```
 */
export function verifyLicense(options: LicenseVerifyOptions): LicenseVerificationResult {
  const { licensePayload, signature, publicKey, currentTime = new Date() } = options;

  // Audit log initialization
  const audit_log = {
    verified_at: currentTime.toISOString(),
    org: licensePayload.org,
    status: 'invalid_signature' as const,
  };

  try {
    // Validate payload structure
    if (!licensePayload.org || !licensePayload.features || !licensePayload.exp) {
      return {
        valid: false,
        expired: false,
        in_grace_period: false,
        features_enabled: [],
        error: 'Malformed license payload: missing required fields',
        audit_log: { ...audit_log, status: 'malformed' },
      };
    }

    // Parse expiration date
    const expirationDate = new Date(licensePayload.exp);
    if (isNaN(expirationDate.getTime())) {
      return {
        valid: false,
        expired: false,
        in_grace_period: false,
        features_enabled: [],
        error: 'Invalid expiration date format',
        audit_log: { ...audit_log, status: 'malformed' },
      };
    }

    // Compute SHA512 hash of license payload
    const payloadString = JSON.stringify(licensePayload, Object.keys(licensePayload).sort());
    const payloadHash = crypto.createHash('sha512').update(payloadString).digest();

    // Decode signature and public key from base64
    const signatureBuffer = Buffer.from(signature, 'base64');
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');

    // Validate key/signature lengths
    if (publicKeyBuffer.length !== 32) {
      return {
        valid: false,
        expired: false,
        in_grace_period: false,
        features_enabled: [],
        error: 'Invalid public key length (expected 32 bytes for Ed25519)',
        audit_log: { ...audit_log, status: 'malformed' },
      };
    }

    if (signatureBuffer.length !== 64) {
      return {
        valid: false,
        expired: false,
        in_grace_period: false,
        features_enabled: [],
        error: 'Invalid signature length (expected 64 bytes for Ed25519)',
        audit_log: { ...audit_log, status: 'invalid_signature' },
      };
    }

    // Verify Ed25519 signature
    const isValidSignature = crypto.verify(
      null, // Ed25519 doesn't use a separate hash algorithm
      payloadHash,
      {
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki',
      } as any, // crypto.verify typing is incomplete for Ed25519
      signatureBuffer
    );

    if (!isValidSignature) {
      return {
        valid: false,
        expired: false,
        in_grace_period: false,
        features_enabled: [],
        error: 'Invalid signature: Ed25519 verification failed',
        audit_log: { ...audit_log, status: 'invalid_signature' },
      };
    }

    // Check expiration
    const now = currentTime.getTime();
    const exp = expirationDate.getTime();
    const gracePeriodMs = (licensePayload.grace_period_seconds || 0) * 1000;
    const expWithGrace = exp + gracePeriodMs;

    const expired = now > exp;
    const in_grace_period = expired && now <= expWithGrace;
    const fully_expired = now > expWithGrace;

    if (fully_expired) {
      return {
        valid: false,
        expired: true,
        in_grace_period: false,
        features_enabled: [],
        error: `License expired on ${licensePayload.exp} (grace period ended)`,
        audit_log: { ...audit_log, status: 'expired' },
      };
    }

    // License is valid (either not expired or in grace period)
    return {
      valid: true,
      expired,
      in_grace_period,
      features_enabled: licensePayload.features,
      audit_log: { ...audit_log, status: 'valid' },
    };
  } catch (error) {
    return {
      valid: false,
      expired: false,
      in_grace_period: false,
      features_enabled: [],
      error: `License verification error: ${error instanceof Error ? error.message : String(error)}`,
      audit_log: { ...audit_log, status: 'invalid_signature' },
    };
  }
}

/**
 * Check if a specific feature is enabled in the license
 *
 * @param result - License verification result
 * @param feature - Feature name to check
 * @returns True if feature is enabled and license is valid
 *
 * @example
 * ```typescript
 * const result = verifyLicense({ ... });
 * if (!isFeatureEnabled(result, 'commerce')) {
 *   throw new Error('Commerce feature not licensed');
 * }
 * ```
 */
export function isFeatureEnabled(result: LicenseVerificationResult, feature: string): boolean {
  return result.valid && result.features_enabled.includes(feature);
}

/**
 * Enforce license check for high-risk actions
 *
 * @param result - License verification result
 * @param requiredFeature - Feature required for the action
 * @throws Error if license is invalid or feature not enabled
 *
 * @example
 * ```typescript
 * const result = verifyLicense({ ... });
 * enforceLicense(result, 'commerce'); // Throws if not licensed
 * // Proceed with commerce operation
 * ```
 */
export function enforceLicense(result: LicenseVerificationResult, requiredFeature: string): void {
  if (!result.valid) {
    const error = new Error(
      `License validation failed: ${result.error || 'Unknown error'}. High-risk action denied.`
    );
    (error as any).code = 'LICENSE_INVALID';
    (error as any).audit_log = result.audit_log;
    throw error;
  }

  if (!result.features_enabled.includes(requiredFeature)) {
    const error = new Error(
      `Feature '${requiredFeature}' not licensed. Licensed features: ${result.features_enabled.join(', ')}`
    );
    (error as any).code = 'FEATURE_NOT_LICENSED';
    (error as any).audit_log = result.audit_log;
    throw error;
  }

  // Warn if in grace period
  if (result.in_grace_period) {
    console.warn(
      `⚠️  LICENSE WARNING: License expired but in grace period. Renew immediately. (Org: ${result.audit_log.org})`
    );
  }
}

/**
 * Generate Ed25519 key pair (for testing/setup only)
 *
 * @returns Object with publicKey and privateKey (base64-encoded)
 *
 * @example
 * ```typescript
 * const { publicKey, privateKey } = generateEd25519KeyPair();
 * // Store privateKey securely, distribute publicKey to verifiers
 * ```
 */
export function generateEd25519KeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  return {
    publicKey: (publicKey as Buffer).toString('base64'),
    privateKey: (privateKey as Buffer).toString('base64'),
  };
}

/**
 * Sign a license payload with Ed25519 private key (for license generation)
 *
 * @param payload - License payload to sign
 * @param privateKey - Base64-encoded Ed25519 private key
 * @returns Base64-encoded signature
 *
 * @example
 * ```typescript
 * const signature = signLicense(
 *   { org: "acme", features: ["commerce"], exp: "2026-01-01T00:00:00Z", ... },
 *   privateKeyBase64
 * );
 * ```
 */
export function signLicense(payload: LicensePayload, privateKey: string): string {
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = crypto.createHash('sha512').update(payloadString).digest();

  const privateKeyBuffer = Buffer.from(privateKey, 'base64');

  const signature = crypto.sign(null, payloadHash, {
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8',
  } as any);

  return signature.toString('base64');
}
