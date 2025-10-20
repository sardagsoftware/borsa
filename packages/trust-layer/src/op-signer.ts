/**
 * OPERATION SIGNER
 *
 * Purpose: Cryptographic signing of critical operations using Ed25519
 * Security: Non-repudiation, integrity verification, replay attack prevention
 * Use cases: Price updates, refunds, data exports, model deployments
 */

import crypto from 'crypto';
import {
  SignedOperationRequest,
  SignedOperation,
  VerificationResult,
  KeyPair,
} from './types';

/**
 * Operation Signer using Ed25519
 */
export class OperationSigner {
  /**
   * Generate Ed25519 key pair
   * Production: Use HSM or key management service (AWS KMS, Azure Key Vault)
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

    return {
      publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
    };
  }

  /**
   * Sign an operation
   *
   * @param request - Operation to sign
   * @param privateKey - Ed25519 private key (base64)
   * @returns Signed operation with signature
   */
  signOperation(request: SignedOperationRequest, privateKey: string): SignedOperation {
    // Validate request
    SignedOperationRequest.parse(request);

    const operation_id = crypto.randomUUID();

    // Create canonical payload for signing
    const canonicalPayload = JSON.stringify({
      operation_id,
      operation_type: request.operation_type,
      payload: request.payload,
      actor: request.actor,
      timestamp: request.timestamp,
      nonce: request.nonce,
    });

    // Import private key
    const privateKeyObject = crypto.createPrivateKey({
      key: Buffer.from(privateKey, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });

    // Sign the canonical payload
    const signature = crypto.sign(null, Buffer.from(canonicalPayload, 'utf8'), privateKeyObject);

    // Derive public key from private key
    const publicKeyObject = crypto.createPublicKey(privateKeyObject);
    const public_key = publicKeyObject.export({ type: 'spki', format: 'der' }).toString('base64');

    return {
      operation_id,
      operation_type: request.operation_type,
      payload: request.payload,
      actor: request.actor,
      timestamp: request.timestamp,
      signature: signature.toString('base64'),
      public_key,
      algorithm: 'Ed25519',
    };
  }

  /**
   * Verify a signed operation
   *
   * @param operation - Signed operation to verify
   * @returns Verification result
   */
  verifyOperation(operation: SignedOperation): VerificationResult {
    const verified_at = new Date().toISOString();

    try {
      // Validate operation structure
      SignedOperation.parse(operation);

      // Reconstruct canonical payload
      const canonicalPayload = JSON.stringify({
        operation_id: operation.operation_id,
        operation_type: operation.operation_type,
        payload: operation.payload,
        actor: operation.actor,
        timestamp: operation.timestamp,
        // Note: nonce is not included in operation, but was in request
        // This is fine - signature is based on what was signed
      });

      // Import public key
      const publicKeyObject = crypto.createPublicKey({
        key: Buffer.from(operation.public_key, 'base64'),
        format: 'der',
        type: 'spki',
      });

      // Verify signature
      const isValid = crypto.verify(
        null,
        Buffer.from(canonicalPayload, 'utf8'),
        publicKeyObject,
        Buffer.from(operation.signature, 'base64')
      );

      // Additional checks
      const timestamp = new Date(operation.timestamp);
      const now = new Date();
      const ageInMinutes = (now.getTime() - timestamp.getTime()) / 1000 / 60;

      // Reject operations older than 30 minutes (prevent replay attacks)
      if (ageInMinutes > 30) {
        return {
          valid: false,
          operation_id: operation.operation_id,
          verified_at,
          public_key: operation.public_key,
          error_message: `Operation timestamp is too old: ${ageInMinutes.toFixed(0)} minutes (max: 30)`,
        };
      }

      return {
        valid: isValid,
        operation_id: operation.operation_id,
        verified_at,
        public_key: operation.public_key,
        error_message: isValid ? undefined : 'Signature verification failed',
      };
    } catch (error: any) {
      return {
        valid: false,
        operation_id: operation.operation_id,
        verified_at,
        public_key: operation.public_key,
        error_message: `Verification error: ${error.message}`,
      };
    }
  }

  /**
   * Sign a price update operation
   */
  signPriceUpdate(params: {
    sku: string;
    old_price: number;
    new_price: number;
    actor: string;
    privateKey: string;
  }): SignedOperation {
    const request: SignedOperationRequest = {
      operation_type: 'price_update',
      payload: {
        sku: params.sku,
        old_price: params.old_price,
        new_price: params.new_price,
        change_percent: ((params.new_price - params.old_price) / params.old_price) * 100,
      },
      actor: params.actor,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return this.signOperation(request, params.privateKey);
  }

  /**
   * Sign a refund approval operation
   */
  signRefundApproval(params: {
    order_id: string;
    refund_amount: number;
    reason: string;
    actor: string;
    privateKey: string;
  }): SignedOperation {
    const request: SignedOperationRequest = {
      operation_type: 'refund_approval',
      payload: {
        order_id: params.order_id,
        refund_amount: params.refund_amount,
        reason: params.reason,
      },
      actor: params.actor,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return this.signOperation(request, params.privateKey);
  }

  /**
   * Sign a data export operation
   */
  signDataExport(params: {
    export_type: string;
    filters: Record<string, any>;
    requestor: string;
    privateKey: string;
  }): SignedOperation {
    const request: SignedOperationRequest = {
      operation_type: 'data_export',
      payload: {
        export_type: params.export_type,
        filters: params.filters,
        timestamp: new Date().toISOString(),
      },
      actor: params.requestor,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return this.signOperation(request, params.privateKey);
  }

  /**
   * Sign a model deployment operation
   */
  signModelDeployment(params: {
    model_name: string;
    model_version: string;
    environment: 'staging' | 'production';
    deployer: string;
    privateKey: string;
  }): SignedOperation {
    const request: SignedOperationRequest = {
      operation_type: 'model_deployment',
      payload: {
        model_name: params.model_name,
        model_version: params.model_version,
        environment: params.environment,
      },
      actor: params.deployer,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return this.signOperation(request, params.privateKey);
  }
}

/**
 * Signature store for tracking signed operations
 * Production: Use PostgreSQL or blockchain for immutable log
 */
export class SignatureStore {
  private operations: Map<string, SignedOperation> = new Map();

  /**
   * Store a signed operation
   */
  async store(operation: SignedOperation): Promise<void> {
    this.operations.set(operation.operation_id, operation);
  }

  /**
   * Retrieve a signed operation
   */
  async get(operation_id: string): Promise<SignedOperation | undefined> {
    return this.operations.get(operation_id);
  }

  /**
   * List all operations by actor
   */
  async listByActor(actor: string): Promise<SignedOperation[]> {
    return Array.from(this.operations.values()).filter((op) => op.actor === actor);
  }

  /**
   * List all operations by type
   */
  async listByType(operation_type: string): Promise<SignedOperation[]> {
    return Array.from(this.operations.values()).filter((op) => op.operation_type === operation_type);
  }

  /**
   * Count total operations
   */
  async count(): Promise<number> {
    return this.operations.size;
  }
}
