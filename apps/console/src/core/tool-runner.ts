/**
 * 🛠️ Tool Runner - Unified Surface Tool Execution Engine
 *
 * ChatGPT-style tool invocation with:
 * - RBAC/ABAC scope checks
 * - Vault/KMS secret fetching
 * - 429 Retry-After + exponential backoff with jitter
 * - Idempotency key support
 * - SSE streaming for long operations
 * - Performance telemetry
 * - Turkish error messages (i18n compatible)
 *
 * @module core/tool-runner
 */

import { getToolConfig, resolveSecrets, ToolConfig } from './tool-registry';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export interface ToolExecutionOptions {
  /** Action ID (e.g., 'shipment.track', 'product.sync') */
  action: string;

  /** Parameters extracted from intent */
  params: Record<string, any>;

  /** User ID for RBAC checks */
  userId: string;

  /** User's RBAC scopes */
  userScopes: string[];

  /** Vendor ID (optional, resolved from params) */
  vendor?: string;

  /** Idempotency key (optional, auto-generated if not provided) */
  idempotencyKey?: string;

  /** SSE streaming callback */
  onStream?: (chunk: string) => void;

  /** Telemetry context */
  telemetry?: {
    sessionId: string;
    conversationId: string;
    messageId: string;
  };
}

export interface ToolExecutionResult<T = any> {
  /** Execution success flag */
  success: boolean;

  /** Result data (if success) */
  data?: T;

  /** Error message (if failure, sanitized for display) */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: string;

  /** Turkish error message */
  errorTR?: string;

  /** Number of retry attempts */
  retries?: number;

  /** Execution duration in milliseconds */
  duration?: number;

  /** Result cached? */
  cached?: boolean;

  /** Idempotency key used */
  idempotencyKey?: string;

  /** SSE stream? */
  streamed?: boolean;
}

export interface VaultSecret {
  key: string;
  value: string;
  expiresAt: number;
}

// ============================================================================
// Error Messages (Turkish + English)
// ============================================================================

const ERROR_MESSAGES: Record<string, { en: string; tr: string }> = {
  INSUFFICIENT_SCOPES: {
    en: 'Insufficient permissions to execute this action',
    tr: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz yok',
  },
  KVKK_REQUIRED: {
    en: 'KVKK compliance check failed',
    tr: 'KVKK uyumluluk kontrolü başarısız',
  },
  VAULT_FETCH_FAILED: {
    en: 'Failed to fetch required secrets',
    tr: 'Gerekli gizli anahtarlar alınamadı',
  },
  RATE_LIMIT_EXCEEDED: {
    en: 'Rate limit exceeded, please try again later',
    tr: 'Hız limiti aşıldı, lütfen daha sonra tekrar deneyin',
  },
  TIMEOUT: {
    en: 'Request timeout',
    tr: 'İstek zaman aşımına uğradı',
  },
  NETWORK_ERROR: {
    en: 'Network connection error',
    tr: 'Ağ bağlantı hatası',
  },
  INVALID_PARAMS: {
    en: 'Invalid parameters provided',
    tr: 'Geçersiz parametreler sağlandı',
  },
  TOOL_NOT_FOUND: {
    en: 'Tool configuration not found',
    tr: 'Araç yapılandırması bulunamadı',
  },
  EXECUTION_ERROR: {
    en: 'Tool execution failed',
    tr: 'Araç çalıştırması başarısız oldu',
  },
};

function getErrorMessage(code: string, locale: string = 'tr'): string {
  const msg = ERROR_MESSAGES[code];
  if (!msg) return code;
  return locale === 'tr' ? msg.tr : msg.en;
}

// ============================================================================
// Retry Logic with Exponential Backoff + Jitter
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate backoff duration with exponential backoff + jitter
 * Respects 429 Retry-After header if provided
 */
function calculateBackoff(
  attempt: number,
  retryAfterSeconds?: number
): number {
  if (retryAfterSeconds) {
    // Use server-provided Retry-After
    return retryAfterSeconds * 1000;
  }

  // Exponential backoff: base^attempt * baseMs
  const base = 2;
  const baseMs = 1000;
  const exponential = Math.pow(base, attempt) * baseMs;

  // Add jitter: ±25% randomness
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);

  // Cap at 30 seconds
  return Math.min(exponential + jitter, 30000);
}

/**
 * Retry wrapper with exponential backoff and 429 handling
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: ToolConfig
): Promise<{ result: T; retries: number }> {
  const { maxAttempts, backoffMs, backoffMultiplier, jitterMs } = config.retry;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (error: any) {
      lastError = error;

      // Don't retry on non-retryable errors
      if (error.status) {
        if (error.status === 400 || error.status === 401 || error.status === 403) {
          throw error; // Client errors - don't retry
        }
      }

      // Last attempt - don't wait
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Calculate backoff
      let waitMs = backoffMs * Math.pow(backoffMultiplier, attempt);

      // Add jitter
      const jitterAmount = jitterMs * (Math.random() * 2 - 1);
      waitMs += jitterAmount;

      // Respect Retry-After header for 429
      if (error.status === 429 && error.retryAfter) {
        waitMs = error.retryAfter * 1000;
      }

      console.warn(`[Tool Runner] Retry ${attempt + 1}/${maxAttempts} after ${Math.round(waitMs)}ms`);

      await sleep(waitMs);
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// ============================================================================
// RBAC Scope Checking
// ============================================================================

function checkScopes(
  required: string[],
  userScopes: string[]
): boolean {
  if (required.length === 0) return true; // No scopes required = public

  return required.every(scope => userScopes.includes(scope));
}

// ============================================================================
// Vault/KMS Secret Fetching (Server-Side)
// ============================================================================

/**
 * Fetch secrets from Vault/KMS (server-side only)
 * Secrets are NEVER exposed to client
 */
async function fetchSecretsFromVault(
  secretKeys: string[],
  vendor?: string
): Promise<Record<string, string>> {
  if (secretKeys.length === 0) return {};

  try {
    const response = await fetch('/api/vault/secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keys: secretKeys,
        vendor,
      }),
    });

    if (!response.ok) {
      throw new Error('Vault fetch failed');
    }

    const data = await response.json();
    return data.secrets || {};
  } catch (error) {
    console.error('[Tool Runner] Vault fetch error:', error);
    throw error;
  }
}

// ============================================================================
// Idempotency Key Generation
// ============================================================================

function generateIdempotencyKey(
  userId: string,
  action: string,
  params: Record<string, any>
): string {
  const timestamp = Date.now();
  const paramsHash = JSON.stringify(params);
  return `idem_${userId}_${action}_${timestamp}_${hashCode(paramsHash)}`;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Telemetry Tracking
// ============================================================================

async function emitTelemetry(
  action: string,
  result: ToolExecutionResult,
  context?: {
    sessionId: string;
    conversationId: string;
    messageId: string;
  }
): Promise<void> {
  try {
    // Fire-and-forget telemetry
    await fetch('/api/telemetry/tool-execution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        success: result.success,
        duration: result.duration,
        retries: result.retries,
        cached: result.cached,
        streamed: result.streamed,
        errorCode: result.errorCode,
        timestamp: Date.now(),
        ...context,
      }),
    });
  } catch (error) {
    // Silent fail - telemetry should not block execution
    console.warn('[Tool Runner] Telemetry emission failed:', error);
  }
}

// ============================================================================
// Main Tool Execution Function
// ============================================================================

/**
 * Execute a tool with full RBAC, Vault, retry, and telemetry support
 *
 * @example
 * ```typescript
 * const result = await runTool({
 *   action: 'shipment.track',
 *   params: { trackingNumber: '1234567890' },
 *   userId: 'user_123',
 *   userScopes: ['shipment:read'],
 * });
 *
 * if (result.success) {
 *   console.log('Tracking data:', result.data);
 * } else {
 *   console.error('Error:', result.errorTR); // Turkish error message
 * }
 * ```
 */
export async function runTool<T = any>(
  options: ToolExecutionOptions
): Promise<ToolExecutionResult<T>> {
  const startTime = Date.now();
  const {
    action,
    params,
    userId,
    userScopes,
    vendor,
    idempotencyKey: providedKey,
    onStream,
    telemetry,
  } = options;

  console.log(`[Tool Runner] Executing: ${action}`, params);

  // ========================================
  // 1. Get Tool Configuration
  // ========================================

  const toolConfig = getToolConfig(action);

  if (!toolConfig) {
    const result: ToolExecutionResult = {
      success: false,
      errorCode: 'TOOL_NOT_FOUND',
      error: getErrorMessage('TOOL_NOT_FOUND', 'en'),
      errorTR: getErrorMessage('TOOL_NOT_FOUND', 'tr'),
      duration: Date.now() - startTime,
    };

    await emitTelemetry(action, result, telemetry);
    return result;
  }

  // ========================================
  // 2. RBAC Scope Check
  // ========================================

  const hasScopes = checkScopes(toolConfig.scopes, userScopes);

  if (!hasScopes) {
    const result: ToolExecutionResult = {
      success: false,
      errorCode: 'INSUFFICIENT_SCOPES',
      error: getErrorMessage('INSUFFICIENT_SCOPES', 'en'),
      errorTR: getErrorMessage('INSUFFICIENT_SCOPES', 'tr'),
      duration: Date.now() - startTime,
    };

    await emitTelemetry(action, result, telemetry);
    return result;
  }

  // ========================================
  // 3. Legal/Compliance Check
  // ========================================

  if (toolConfig.legal.kvkk) {
    // TODO: Add KVKK compliance check
    // For now, we assume compliance
  }

  // ========================================
  // 4. Generate Idempotency Key
  // ========================================

  const idempotencyKey = providedKey || generateIdempotencyKey(userId, action, params);

  // ========================================
  // 5. Fetch Secrets from Vault
  // ========================================

  let secrets: Record<string, string> = {};

  if (toolConfig.secrets.length > 0) {
    try {
      const resolvedSecrets = resolveSecrets(toolConfig, vendor);
      secrets = await fetchSecretsFromVault(resolvedSecrets, vendor);
    } catch (error) {
      const result: ToolExecutionResult = {
        success: false,
        errorCode: 'VAULT_FETCH_FAILED',
        error: getErrorMessage('VAULT_FETCH_FAILED', 'en'),
        errorTR: getErrorMessage('VAULT_FETCH_FAILED', 'tr'),
        duration: Date.now() - startTime,
      };

      await emitTelemetry(action, result, telemetry);
      return result;
    }
  }

  // ========================================
  // 6. Execute with Retry Logic
  // ========================================

  try {
    const { result: apiResult, retries } = await retryWithBackoff(async () => {
      const response = await fetch(toolConfig.endpoint, {
        method: toolConfig.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
          'X-User-Id': userId,
        },
        body: toolConfig.method !== 'GET' ? JSON.stringify({
          ...params,
          vendor,
        }) : undefined,
        signal: AbortSignal.timeout(toolConfig.timeout),
      });

      // Handle 429 Rate Limit
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        error.retryAfter = retryAfter;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      // Handle SSE streaming
      if (toolConfig.streaming && onStream) {
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const chunk = line.slice(6);
                onStream(chunk);
              }
            }
          }
        }
      }

      return await response.json();
    }, toolConfig);

    const duration = Date.now() - startTime;

    const result: ToolExecutionResult<T> = {
      success: true,
      data: apiResult,
      retries,
      duration,
      cached: apiResult?.cached || false,
      streamed: toolConfig.streaming && !!onStream,
      idempotencyKey,
    };

    await emitTelemetry(action, result, telemetry);

    console.log(`[Tool Runner] Success: ${action} (${duration}ms, ${retries} retries)`);

    return result;

  } catch (error: any) {
    const duration = Date.now() - startTime;

    let errorCode = 'EXECUTION_ERROR';
    if (error.status === 429) errorCode = 'RATE_LIMIT_EXCEEDED';
    else if (error.name === 'TimeoutError') errorCode = 'TIMEOUT';
    else if (error.message?.includes('network')) errorCode = 'NETWORK_ERROR';

    const result: ToolExecutionResult = {
      success: false,
      errorCode,
      error: getErrorMessage(errorCode, 'en'),
      errorTR: getErrorMessage(errorCode, 'tr'),
      duration,
      idempotencyKey,
    };

    await emitTelemetry(action, result, telemetry);

    console.error(`[Tool Runner] Failed: ${action}`, error);

    return result;
  }
}

// ============================================================================
// Batch Tool Execution
// ============================================================================

export async function runToolBatch(
  tools: ToolExecutionOptions[]
): Promise<ToolExecutionResult[]> {
  console.log(`[Tool Runner] Executing ${tools.length} tools in batch`);

  const results = await Promise.all(
    tools.map(tool => runTool(tool))
  );

  const successCount = results.filter(r => r.success).length;
  console.log(`[Tool Runner] Batch complete: ${successCount}/${tools.length} succeeded`);

  return results;
}

console.log('✅ Tool Runner loaded (RBAC + Vault + Retry + SSE + Telemetry)');
