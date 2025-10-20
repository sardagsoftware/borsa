/**
 * LYDIAN-IQ WATERMARK & CANARY TOKENS
 *
 * Purpose: Detect unauthorized code execution or IP theft
 * Technique: Honeytokens (canary functions) that trigger alerts when accessed
 *
 * Features:
 * - Insert no-op canary functions with stable hashes
 * - Emit alert if canary is triggered unexpectedly
 * - Track canary access attempts (audit log)
 * - Integration with outbound-guard for network canaries
 *
 * Use Cases:
 * - Detect code scraping/theft (canary functions in obfuscated code)
 * - Detect unauthorized deployments (canaries trigger in wrong env)
 * - Detect reverse engineering attempts
 *
 * Security:
 * - Canaries are deterministic (stable hash across builds)
 * - Alerts sent to monitoring (Prometheus, Sentry, etc.)
 * - Never expose canary IDs in production error messages
 */

import crypto from 'crypto';

/**
 * Canary token definition
 */
export interface CanaryToken {
  canary_id: string; // Unique canary identifier
  function_path: string; // Logical path (e.g., "lib/utils/obscure_helper")
  stable_hash: string; // SHA256(canary_id + salt)
  created_at: string; // ISO 8601
  expected_triggers: number; // 0 for honeytokens
  metadata?: Record<string, any>;
}

/**
 * Canary trigger event
 */
export interface CanaryTriggerEvent {
  canary_id: string;
  triggered_at: string; // ISO 8601
  stack_trace?: string;
  actor?: string; // IP address, user ID, etc.
  context?: Record<string, any>;
}

/**
 * In-memory canary registry
 */
const canaryRegistry: Map<string, CanaryToken> = new Map();

/**
 * Alert callback (customizable)
 */
type AlertCallback = (event: CanaryTriggerEvent) => void;

let alertCallback: AlertCallback = (event) => {
  console.error(`🚨 [CANARY TRIGGERED] ${event.canary_id} at ${event.triggered_at}`);
  console.error(`   Stack: ${event.stack_trace || 'N/A'}`);
  console.error(`   Context: ${JSON.stringify(event.context || {})}`);
};

/**
 * Set custom alert callback
 *
 * @param callback - Function to call when canary is triggered
 *
 * @example
 * ```typescript
 * setAlertCallback((event) => {
 *   // Send to Sentry
 *   Sentry.captureMessage(`Canary triggered: ${event.canary_id}`, {
 *     level: 'critical',
 *     extra: event
 *   });
 * });
 * ```
 */
export function setAlertCallback(callback: AlertCallback): void {
  alertCallback = callback;
}

/**
 * Insert a canary token
 *
 * @param functionPath - Logical path for the canary (e.g., "lib/utils/obscure_helper")
 * @param canaryId - Unique canary identifier
 * @returns Canary token object
 *
 * @example
 * ```typescript
 * const canary = insertCanary("lib/utils/obscure_helper", "canary_001");
 * // Later in code:
 * export function obscureHelper() {
 *   triggerCanary("canary_001"); // This should never execute
 *   // ... rest of function
 * }
 * ```
 */
export function insertCanary(functionPath: string, canaryId: string): CanaryToken {
  const salt = process.env.CANARY_SALT || 'lydian-iq-default-salt';
  const stableHash = crypto
    .createHash('sha256')
    .update(`${canaryId}|${salt}`)
    .digest('hex');

  const canary: CanaryToken = {
    canary_id: canaryId,
    function_path: functionPath,
    stable_hash: stableHash,
    created_at: new Date().toISOString(),
    expected_triggers: 0, // Honeytoken: should never trigger
  };

  canaryRegistry.set(canaryId, canary);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[WATERMARK] Canary inserted: ${canaryId} at ${functionPath}`);
  }

  return canary;
}

/**
 * Trigger a canary (called from canary function)
 *
 * This should NEVER execute in normal operation.
 * If triggered, it indicates unauthorized code execution.
 *
 * @param canaryId - Canary identifier
 * @param context - Optional context (e.g., request info)
 *
 * @example
 * ```typescript
 * export function obscureHelper() {
 *   triggerCanary("canary_001"); // 🚨 ALERT if executed
 *   // ...
 * }
 * ```
 */
export function triggerCanary(canaryId: string, context?: Record<string, any>): void {
  const canary = canaryRegistry.get(canaryId);

  if (!canary) {
    console.error(`[WATERMARK] Unknown canary triggered: ${canaryId}`);
    return;
  }

  // Capture stack trace
  const error = new Error();
  const stackTrace = error.stack || '';

  const event: CanaryTriggerEvent = {
    canary_id: canaryId,
    triggered_at: new Date().toISOString(),
    stack_trace: stackTrace,
    context,
  };

  // Emit alert
  alertCallback(event);

  // Optionally: increment counter for rate limiting
  // (to prevent alert spam if canary is repeatedly triggered)
}

/**
 * Verify canary hash (for build integrity)
 *
 * @param canaryId - Canary identifier
 * @param expectedHash - Expected stable hash
 * @returns True if hash matches
 *
 * @example
 * ```typescript
 * const isValid = verifyCanaryHash("canary_001", storedHash);
 * if (!isValid) {
 *   console.error("Build integrity compromised: canary hash mismatch");
 * }
 * ```
 */
export function verifyCanaryHash(canaryId: string, expectedHash: string): boolean {
  const canary = canaryRegistry.get(canaryId);
  if (!canary) {
    return false;
  }

  return canary.stable_hash === expectedHash;
}

/**
 * Get all registered canaries (for inspection)
 *
 * @returns Array of canary tokens
 */
export function getAllCanaries(): CanaryToken[] {
  return Array.from(canaryRegistry.values());
}

/**
 * Export canary manifest (for build reproducibility)
 *
 * @returns JSON string of canary registry
 *
 * @example
 * ```typescript
 * const manifest = exportCanaryManifest();
 * fs.writeFileSync('canary-manifest.json', manifest);
 * ```
 */
export function exportCanaryManifest(): string {
  const canaries = getAllCanaries();
  return JSON.stringify(
    {
      version: '1.0',
      generated_at: new Date().toISOString(),
      canaries,
    },
    null,
    2
  );
}

/**
 * Clear canary registry (for testing only)
 *
 * ⚠️ WARNING: This removes all canaries. Use only in tests.
 */
export function clearCanaries(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('clearCanaries() not allowed in production');
  }
  canaryRegistry.clear();
}

/**
 * Create a no-op canary function
 *
 * Returns a function that triggers the canary and returns a default value.
 *
 * @param canaryId - Canary identifier
 * @param defaultReturn - Default return value (optional)
 * @returns Canary function
 *
 * @example
 * ```typescript
 * // In your code:
 * export const obscureHelper = createCanaryFunction("canary_001", null);
 * // If called: triggers alert and returns null
 * ```
 */
export function createCanaryFunction<T = any>(
  canaryId: string,
  defaultReturn?: T
): (...args: any[]) => T | undefined {
  return function (...args: any[]): T | undefined {
    triggerCanary(canaryId, { args });
    return defaultReturn;
  };
}

/**
 * Network canary: Outbound request canary
 *
 * Generates a canary URL that should never be accessed.
 * If accessed, it indicates SSRF attempt or IP theft.
 *
 * @param canaryId - Canary identifier
 * @returns Canary URL
 *
 * @example
 * ```typescript
 * const canaryUrl = createNetworkCanary("canary_network_001");
 * // Store in code: "https://canary.example.com/xyz..."
 * // If accessed: SSRF detected
 * ```
 */
export function createNetworkCanary(canaryId: string): string {
  const canaryDomain = process.env.CANARY_DOMAIN || 'canary.lydian-iq.internal';
  const canaryPath = crypto.randomBytes(16).toString('hex');

  insertCanary(`network/${canaryPath}`, canaryId);

  return `https://${canaryDomain}/${canaryPath}`;
}

/**
 * Middleware: Canary request detector
 *
 * Detects if incoming request matches a network canary.
 *
 * @param req - Express-like request object
 * @returns True if canary detected
 */
export function isCanaryRequest(req: { url: string; headers: any }): boolean {
  const url = req.url || '';

  // Check if URL contains canary pattern
  const canaries = getAllCanaries();
  for (const canary of canaries) {
    if (canary.function_path.startsWith('network/')) {
      const canaryPath = canary.function_path.replace('network/', '');
      if (url.includes(canaryPath)) {
        triggerCanary(canary.canary_id, {
          url,
          headers: req.headers,
          type: 'network_canary',
        });
        return true;
      }
    }
  }

  return false;
}
