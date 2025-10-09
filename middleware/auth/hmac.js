/**
 * HMAC Signature Authentication Middleware
 * Validates request signatures using HMAC-SHA256
 *
 * White-Hat Policy: Secure signature validation, replay attack prevention
 */

import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const TIMESTAMP_TOLERANCE = 300; // 5 minutes (300 seconds)

/**
 * HMAC Signature authentication middleware
 * Usage: app.use(hmacAuth)
 */
export async function hmacAuth(req, res, next) {
  try {
    // Skip OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const signature = req.headers['x-hmac-signature'];
    const timestamp = req.headers['x-hmac-timestamp'];
    const algorithm = req.headers['x-hmac-algorithm'];
    const keyId = req.headers['x-hmac-key-id'];

    // Check required headers
    if (!signature || !timestamp || !algorithm || !keyId) {
      return res.status(401).json({
        error: {
          code: 'MISSING_HMAC_HEADERS',
          message: 'Required HMAC headers: X-HMAC-Signature, X-HMAC-Timestamp, X-HMAC-Algorithm, X-HMAC-Key-ID',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate algorithm
    if (algorithm !== 'HMAC-SHA256') {
      return res.status(401).json({
        error: {
          code: 'UNSUPPORTED_ALGORITHM',
          message: 'Only HMAC-SHA256 algorithm is supported',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate timestamp (prevent replay attacks)
    const requestTimestamp = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - requestTimestamp);

    if (timeDifference > TIMESTAMP_TOLERANCE) {
      return res.status(401).json({
        error: {
          code: 'TIMESTAMP_OUT_OF_RANGE',
          message: `Request timestamp must be within ${TIMESTAMP_TOLERANCE} seconds`,
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Fetch HMAC key from database
    const { data: keyRecord, error: dbError } = await supabase
      .from('hmac_keys')
      .select('*')
      .eq('key_id', keyId)
      .single();

    if (dbError || !keyRecord) {
      return res.status(401).json({
        error: {
          code: 'INVALID_KEY_ID',
          message: 'Invalid HMAC key ID',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if key is active
    if (keyRecord.status !== 'active') {
      return res.status(401).json({
        error: {
          code: 'HMAC_KEY_INACTIVE',
          message: `HMAC key is ${keyRecord.status}`,
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Construct canonical request
    const method = req.method;
    const path = req.path;

    // Get request body
    let bodyString = '';
    if (req.body && Object.keys(req.body).length > 0) {
      bodyString = JSON.stringify(req.body);
    }

    const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
    const canonical = `${method}\n${path}\n${timestamp}\n${bodyHash}`;

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', keyRecord.secret)
      .update(canonical)
      .digest('hex');

    // Extract signature from header (format: sha256=<signature>)
    const providedSignature = signature.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    // Compare signatures (timing-safe comparison)
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );

    if (!signaturesMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'HMAC signature verification failed',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check for replay attacks using signature + timestamp combination
    const signatureId = `${keyId}:${timestamp}:${providedSignature.substring(0, 16)}`;

    const { data: usedSignature } = await supabase
      .from('hmac_signatures_used')
      .select('id')
      .eq('signature_id', signatureId)
      .single();

    if (usedSignature) {
      return res.status(401).json({
        error: {
          code: 'REPLAY_ATTACK_DETECTED',
          message: 'This signature has already been used',
          correlationId: nanoid(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Store signature to prevent replay attacks
    await supabase.from('hmac_signatures_used').insert({
      signature_id: signatureId,
      key_id: keyId,
      timestamp: new Date(requestTimestamp * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Log HMAC key usage
    await supabase.from('hmac_key_usage').insert({
      key_id: keyRecord.id,
      endpoint: req.path,
      method: req.method,
      ip_address: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      timestamp: new Date().toISOString(),
    });

    // Attach auth info to request
    req.auth = {
      type: 'hmac',
      keyId: keyRecord.id,
      userId: keyRecord.user_id,
      organizationId: keyRecord.organization_id,
      scopes: keyRecord.scopes || [],
    };

    next();
  } catch (error) {
    console.error('HMAC auth error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
        correlationId: nanoid(),
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Generate HMAC key pair
 */
export function generateHmacKeyPair() {
  const keyId = `hmac_${nanoid(24)}`;
  const secret = crypto.randomBytes(32).toString('hex');
  return { keyId, secret };
}

/**
 * Create HMAC key in database
 */
export async function createHmacKey(userId, organizationId, name, scopes = []) {
  const { keyId, secret } = generateHmacKeyPair();

  const { data, error } = await supabase
    .from('hmac_keys')
    .insert({
      key_id: keyId,
      secret,
      user_id: userId,
      organization_id: organizationId,
      name,
      scopes: JSON.stringify(scopes),
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    keyId: data.key_id,
    secret: data.secret, // Return secret only once
    name: data.name,
    scopes: JSON.parse(data.scopes),
    createdAt: data.created_at,
  };
}

/**
 * Calculate HMAC signature for a request (client-side helper)
 */
export function calculateSignature(method, path, timestamp, body, secret) {
  const bodyString = body ? JSON.stringify(body) : '';
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
  const canonical = `${method}\n${path}\n${timestamp}\n${bodyHash}`;
  const signature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  return `sha256=${signature}`;
}

export default hmacAuth;
