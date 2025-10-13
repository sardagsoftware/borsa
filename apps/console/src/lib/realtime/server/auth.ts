/**
 * Realtime Gateway Authentication
 * HMAC verification + RBAC enforcement
 * White-hat: KVKK/GDPR compliant, no PII
 */

import crypto from 'crypto';

/**
 * Verify HMAC signature for WebSocket/SSE connections
 * Replay window: 5 minutes
 */
export function verifyHMAC(
  sig: string,
  ts: string,
  nonce: string,
  body: string,
  secret: string
): boolean {
  try {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = Number(ts);

    // Replay attack protection: 5 minute window
    if (Math.abs(now - timestamp) > 300) {
      console.warn('[RT Auth] Timestamp outside replay window:', { ts, now, diff: now - timestamp });
      return false;
    }

    // Generate expected signature
    const message = `${ts}.${nonce}.${body}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sig)
    );
  } catch (err) {
    console.error('[RT Auth] HMAC verification error:', err);
    return false;
  }
}

/**
 * RBAC: Check if user has required scopes
 *
 * Topic → Required scopes:
 * - kpis.s2 → ops.admin
 * - liveops.events → liveops.admin
 * - economy.patch → economy.admin
 * - ab.status → liveops.admin
 */
export function rbacHas(userScopes: string[], requiredScopes: string[]): boolean {
  return requiredScopes.every(scope => userScopes.includes(scope));
}

/**
 * Get required scopes for a topic
 */
export function getTopicScopes(topic: string): string[] {
  const scopeMap: Record<string, string[]> = {
    'kpis.s2': ['ops.admin'],
    'liveops.events': ['liveops.admin'],
    'economy.patch': ['economy.admin'],
    'ab.status': ['liveops.admin'],
  };

  return scopeMap[topic] || [];
}

/**
 * Nonce store for replay attack prevention (in-memory, should use Redis in prod)
 */
const nonceStore = new Set<string>();
const NONCE_TTL = 300000; // 5 minutes

export function checkNonce(nonce: string): boolean {
  if (nonceStore.has(nonce)) {
    return false; // Replay attack
  }

  nonceStore.add(nonce);

  // Auto-cleanup after TTL
  setTimeout(() => nonceStore.delete(nonce), NONCE_TTL);

  return true;
}
