import { createHash, createHmac, randomBytes } from 'crypto';

/**
 * Generate HMAC signature for webhook validation
 */
export function createHmacSignature(
  payload: string,
  secret: string,
  algorithm: string = 'sha256'
): string {
  return createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = createHmacSignature(payload, secret, algorithm);
  return signature === expectedSignature;
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Hash string with SHA256
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
