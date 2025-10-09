/**
 * TRUST LAYER API - SIGN OPERATION
 *
 * POST /api/trust/sign-operation
 *
 * Purpose: Cryptographically sign critical operations
 * Security: Ed25519 signatures for non-repudiation
 */

import { OperationSigner, SignatureStore } from '../../packages/trust-layer/src/op-signer';

/**
 * Singleton instances
 */
let signer: OperationSigner | null = null;
let store: SignatureStore | null = null;

function getSigner(): OperationSigner {
  if (!signer) {
    signer = new OperationSigner();
  }
  return signer;
}

function getStore(): SignatureStore {
  if (!store) {
    store = new SignatureStore();
  }
  return store;
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return handleSignOperation(req, res);
  }

  if (req.method === 'GET') {
    return handleVerifyOperation(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle POST - Sign an operation
 */
async function handleSignOperation(req: any, res: any) {
  try {
    const { operation_type, payload, actor, privateKey } = req.body;

    // Validate required fields
    if (!operation_type || !payload || !actor || !privateKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'operation_type, payload, actor, and privateKey are required',
      });
    }

    const signer = getSigner();
    const store = getStore();

    // Sign operation
    const signedOperation = signer.signOperation(
      {
        operation_type,
        payload,
        actor,
        timestamp: new Date().toISOString(),
      },
      privateKey
    );

    // Store signed operation
    await store.store(signedOperation);

    return res.status(200).json({
      success: true,
      signed_operation: signedOperation,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Signing error:', error);

    if (error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sign operation',
    });
  }
}

/**
 * Handle GET - Verify an operation
 */
async function handleVerifyOperation(req: any, res: any) {
  try {
    const { operation_id } = req.query;

    if (!operation_id) {
      return res.status(400).json({
        error: 'Missing operation_id',
        message: 'operation_id query parameter is required',
      });
    }

    const store = getStore();
    const signer = getSigner();

    // Retrieve operation
    const operation = await store.get(operation_id);

    if (!operation) {
      return res.status(404).json({
        error: 'Operation not found',
        message: `No operation found with ID: ${operation_id}`,
      });
    }

    // Verify signature
    const verification = signer.verifyOperation(operation);

    return res.status(200).json({
      success: true,
      operation,
      verification,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Verification error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify operation',
    });
  }
}
