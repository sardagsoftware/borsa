/**
 * LYDIAN-IQ WEBHOOK SIGNATURE VERIFICATION
 *
 * Purpose: HMAC-SHA256 signature verification for incoming webhooks
 * Compliance: OWASP API Security Top 10, PCI-DSS Requirement 6.5.10
 *
 * Security Features:
 * - Replay attack protection (300s window)
 * - Timing-safe signature comparison
 * - Nonce validation
 * - Timestamp validation
 *
 * Usage:
 * ```typescript
 * import { verifyWebhookSignature } from '@/lib/security/verifyWebhookSignature';
 *
 * const isValid = verifyWebhookSignature({
 *   payload: req.body,
 *   signature: req.headers['x-signature'],
 *   timestamp: req.headers['x-timestamp'],
 *   nonce: req.headers['x-nonce'],
 *   secret: process.env.WEBHOOK_SECRET
 * });
 * ```
 */

import crypto from "crypto";

/**
 * Webhook signature verification options
 */
export interface WebhookVerificationOptions {
  /** Raw webhook payload (string or buffer) */
  payload: string | Buffer;
  /** HMAC-SHA256 signature from X-Signature header */
  signature: string;
  /** Unix timestamp from X-Timestamp header */
  timestamp: string | number;
  /** Unique nonce from X-Nonce header */
  nonce: string;
  /** Shared secret key for HMAC verification */
  secret: string;
  /** Replay window in milliseconds (default: 300000 = 5 minutes) */
  replayWindow?: number;
}

/**
 * Webhook verification error codes
 */
export enum WebhookErrorCode {
  REPLAY_WINDOW_EXCEEDED = "REPLAY_WINDOW_EXCEEDED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  MISSING_HEADERS = "MISSING_HEADERS",
  INVALID_TIMESTAMP = "INVALID_TIMESTAMP",
  NONCE_REUSED = "NONCE_REUSED"
}

/**
 * Webhook verification error
 */
export class WebhookVerificationError extends Error {
  constructor(
    public code: WebhookErrorCode,
    message: string
  ) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

/**
 * In-memory nonce store (production: use Redis)
 * TTL: 5 minutes
 */
const nonceStore = new Map<string, number>();

/**
 * Clean up expired nonces every minute
 */
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of nonceStore.entries()) {
    if (now > expiresAt) {
      nonceStore.delete(nonce);
    }
  }
}, 60 * 1000);

/**
 * Verify webhook signature using HMAC-SHA256
 *
 * Algorithm:
 * 1. Check timestamp within replay window (≤ 300s)
 * 2. Check nonce hasn't been used before
 * 3. Construct signed message: timestamp.nonce.payload
 * 4. Compute HMAC-SHA256 signature
 * 5. Compare signatures using timing-safe comparison
 *
 * @param options - Verification options
 * @returns true if signature is valid
 * @throws WebhookVerificationError if verification fails
 */
export function verifyWebhookSignature(options: WebhookVerificationOptions): boolean {
  const {
    payload,
    signature,
    timestamp,
    nonce,
    secret,
    replayWindow = 5 * 60 * 1000 // 5 minutes
  } = options;

  // Validate required headers
  if (!signature || !timestamp || !nonce || !secret) {
    throw new WebhookVerificationError(
      WebhookErrorCode.MISSING_HEADERS,
      "Missing required webhook headers (X-Signature, X-Timestamp, X-Nonce)"
    );
  }

  // Validate timestamp format
  const timestampNum = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(timestampNum)) {
    throw new WebhookVerificationError(
      WebhookErrorCode.INVALID_TIMESTAMP,
      `Invalid timestamp format: ${timestamp}`
    );
  }

  // Check replay window (prevent replay attacks)
  const now = Date.now();
  const requestAge = Math.abs(now - timestampNum);

  if (requestAge > replayWindow) {
    throw new WebhookVerificationError(
      WebhookErrorCode.REPLAY_WINDOW_EXCEEDED,
      `Replay window exceeded: request age ${requestAge}ms > ${replayWindow}ms`
    );
  }

  // Check nonce reuse (prevent replay attacks)
  if (nonceStore.has(nonce)) {
    throw new WebhookVerificationError(
      WebhookErrorCode.NONCE_REUSED,
      `Nonce already used: ${nonce}`
    );
  }

  // Store nonce with expiration
  nonceStore.set(nonce, now + replayWindow);

  // Construct signed message: timestamp.nonce.payload
  const payloadStr = typeof payload === "string" ? payload : payload.toString("utf8");
  const signedMessage = `${timestampNum}.${nonce}.${payloadStr}`;

  // Compute HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedMessage)
    .digest("hex");

  // Timing-safe signature comparison (prevent timing attacks)
  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      throw new WebhookVerificationError(
        WebhookErrorCode.INVALID_SIGNATURE,
        "Invalid webhook signature: length mismatch"
      );
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      throw new WebhookVerificationError(
        WebhookErrorCode.INVALID_SIGNATURE,
        "Invalid webhook signature: HMAC mismatch"
      );
    }

    return true;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      throw error;
    }
    throw new WebhookVerificationError(
      WebhookErrorCode.INVALID_SIGNATURE,
      `Invalid webhook signature: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate webhook signature (for testing or sending webhooks)
 *
 * @param payload - Webhook payload
 * @param secret - Shared secret key
 * @returns Object with signature, timestamp, and nonce
 */
export function generateWebhookSignature(
  payload: string | Buffer,
  secret: string
): { signature: string; timestamp: number; nonce: string } {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const payloadStr = typeof payload === "string" ? payload : payload.toString("utf8");
  const signedMessage = `${timestamp}.${nonce}.${payloadStr}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedMessage)
    .digest("hex");

  return { signature, timestamp, nonce };
}

/**
 * Express middleware for webhook signature verification
 *
 * Usage:
 * ```typescript
 * app.post('/webhooks/trendyol',
 *   verifyWebhookMiddleware(process.env.TRENDYOL_WEBHOOK_SECRET),
 *   handleTrendyolWebhook
 * );
 * ```
 */
export function verifyWebhookMiddleware(secret: string) {
  return (req: any, res: any, next: any) => {
    try {
      const signature = req.headers["x-signature"];
      const timestamp = req.headers["x-timestamp"];
      const nonce = req.headers["x-nonce"];

      // Get raw body (must be preserved for signature verification)
      const payload = req.rawBody || JSON.stringify(req.body);

      verifyWebhookSignature({
        payload,
        signature,
        timestamp,
        nonce,
        secret
      });

      // Signature valid, proceed
      next();
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        res.status(401).json({
          error: "Unauthorized",
          code: error.code,
          message: error.message
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Webhook verification failed"
        });
      }
    }
  };
}
