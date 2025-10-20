/**
 * SHARD_12.3 - Idempotency System
 * Prevent duplicate operations
 *
 * Security: Token-based deduplication
 * White Hat: Protect against network retries, double-submit
 */

export interface IdempotencyRecord {
  key: string;
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  response: any;
  createdAt: number;
  expiresAt: number;
}

/**
 * In-memory idempotency store (in production, use Redis)
 */
const idempotencyStore = new Map<string, IdempotencyRecord>();

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Store idempotent response
 */
export function storeIdempotentResponse(
  key: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  response: any,
  ttlMs: number = 24 * 60 * 60 * 1000 // 24 hours
): void {
  const now = Date.now();

  const record: IdempotencyRecord = {
    key,
    userId,
    endpoint,
    method,
    statusCode,
    response,
    createdAt: now,
    expiresAt: now + ttlMs
  };

  idempotencyStore.set(key, record);

  // Auto-cleanup after TTL
  setTimeout(() => {
    idempotencyStore.delete(key);
  }, ttlMs);
}

/**
 * Get idempotent response
 */
export function getIdempotentResponse(key: string): IdempotencyRecord | null {
  const record = idempotencyStore.get(key);

  if (!record) return null;

  // Check expiration
  if (Date.now() > record.expiresAt) {
    idempotencyStore.delete(key);
    return null;
  }

  return record;
}

/**
 * Check if request is idempotent
 */
export function isIdempotentRequest(
  key: string,
  userId: string,
  endpoint: string,
  method: string
): { isDuplicate: boolean; record?: IdempotencyRecord } {
  const record = getIdempotentResponse(key);

  if (!record) {
    return { isDuplicate: false };
  }

  // Verify userId matches
  if (record.userId !== userId) {
    throw new Error('Idempotency key belongs to different user');
  }

  // Verify endpoint and method match
  if (record.endpoint !== endpoint || record.method !== method) {
    throw new Error('Idempotency key used for different operation');
  }

  return {
    isDuplicate: true,
    record
  };
}

/**
 * Validate idempotency key format
 */
export function validateIdempotencyKey(key: string): { valid: boolean; error?: string } {
  // Check length (base64 of 32 bytes ~= 43-44 chars)
  if (key.length < 32 || key.length > 64) {
    return { valid: false, error: 'Invalid key length' };
  }

  // Check characters (base64url safe)
  const validPattern = /^[A-Za-z0-9_-]+$/;
  if (!validPattern.test(key)) {
    return { valid: false, error: 'Invalid key characters' };
  }

  return { valid: true };
}

/**
 * Clean expired records
 */
export function cleanupExpiredRecords(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of idempotencyStore.entries()) {
    if (now > record.expiresAt) {
      idempotencyStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get idempotency stats
 */
export function getIdempotencyStats(): {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
} {
  const now = Date.now();
  let activeKeys = 0;
  let expiredKeys = 0;

  for (const record of idempotencyStore.values()) {
    if (now > record.expiresAt) {
      expiredKeys++;
    } else {
      activeKeys++;
    }
  }

  return {
    totalKeys: idempotencyStore.size,
    activeKeys,
    expiredKeys
  };
}

/**
 * Idempotency middleware helper
 */
export async function handleIdempotentRequest<T>(
  key: string | undefined,
  userId: string,
  endpoint: string,
  method: string,
  handler: () => Promise<{ statusCode: number; response: T }>
): Promise<{ statusCode: number; response: T; fromCache: boolean }> {
  // If no key provided, execute directly
  if (!key) {
    const result = await handler();
    return { ...result, fromCache: false };
  }

  // Validate key format
  const validation = validateIdempotencyKey(key);
  if (!validation.valid) {
    throw new Error(`Invalid idempotency key: ${validation.error}`);
  }

  // Check for existing response
  const check = isIdempotentRequest(key, userId, endpoint, method);

  if (check.isDuplicate && check.record) {
    // Return cached response
    return {
      statusCode: check.record.statusCode,
      response: check.record.response,
      fromCache: true
    };
  }

  // Execute handler
  const result = await handler();

  // Store response
  storeIdempotentResponse(
    key,
    userId,
    endpoint,
    method,
    result.statusCode,
    result.response
  );

  return { ...result, fromCache: false };
}

/**
 * Extract idempotency key from headers
 */
export function extractIdempotencyKey(headers: Headers): string | undefined {
  return headers.get('X-Idempotency-Key') || headers.get('Idempotency-Key') || undefined;
}

/**
 * Check if method should use idempotency
 */
export function shouldUseIdempotency(method: string): boolean {
  // Idempotency for non-idempotent HTTP methods
  return ['POST', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Get idempotency TTL based on operation
 */
export function getIdempotencyTTL(endpoint: string): number {
  // Payment operations: 48 hours
  if (endpoint.includes('/payment') || endpoint.includes('/billing')) {
    return 48 * 60 * 60 * 1000;
  }

  // File uploads: 24 hours
  if (endpoint.includes('/files') || endpoint.includes('/upload')) {
    return 24 * 60 * 60 * 1000;
  }

  // Messages: 1 hour
  if (endpoint.includes('/messages')) {
    return 60 * 60 * 1000;
  }

  // Default: 24 hours
  return 24 * 60 * 60 * 1000;
}
