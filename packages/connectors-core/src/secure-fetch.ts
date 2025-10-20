// ========================================
// SECURE FETCH - HTTP CLIENT WITH RETRY & OTEL
// White-Hat: Observability + Resilience
// ========================================

import crypto from 'crypto';
import type { SecureFetchOptions, SecureFetchResponse } from './types';

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Secure Fetch
 * HTTP client with automatic retry, timeout, and observability
 */
export async function secureFetch<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<SecureFetchResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    signal,
  } = options;

  const requestId = generateRequestId();
  const startTime = Date.now();
  let attemptCount = 0;
  let lastError: any;

  // Add request ID header
  headers['X-Request-ID'] = requestId;

  while (attemptCount < retries) {
    attemptCount++;

    try {
      console.log(`[SecureFetch] ${method} ${url} (attempt ${attemptCount}/${retries}, request: ${requestId})`);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge signals
      const combinedSignal = signal
        ? combineAbortSignals(signal, controller.signal)
        : controller.signal;

      // Make request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
      });

      clearTimeout(timeoutId);

      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        console.warn(`[SecureFetch] Rate limited (429), retrying after ${retryAfter}s`);

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue; // Retry
      }

      // Parse response
      let data: T | undefined;
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      const duration = Date.now() - startTime;

      // Success response
      if (response.ok) {
        console.log(`[SecureFetch] ✅ ${method} ${url} - ${response.status} (${duration}ms, ${attemptCount} attempts)`);

        return {
          success: true,
          data,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          metadata: {
            requestId,
            duration,
            retries: attemptCount - 1,
          },
        };
      }

      // Error response (4xx, 5xx)
      const error = {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
        details: data,
      };

      // Don't retry client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.error(`[SecureFetch] ❌ Client error (${response.status}), not retrying`);

        return {
          success: false,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          error,
          metadata: {
            requestId,
            duration: Date.now() - startTime,
            retries: attemptCount - 1,
          },
        };
      }

      // Server error (5xx) - retry
      lastError = error;
      console.warn(`[SecureFetch] ⚠️ Server error (${response.status}), retrying...`);

    } catch (err: any) {
      lastError = err;

      // Abort error - don't retry
      if (err.name === 'AbortError') {
        console.error(`[SecureFetch] ❌ Request timeout after ${timeout}ms`);

        return {
          success: false,
          statusCode: 0,
          headers: {},
          error: {
            code: 'TIMEOUT',
            message: `Request timeout after ${timeout}ms`,
          },
          metadata: {
            requestId,
            duration: Date.now() - startTime,
            retries: attemptCount - 1,
          },
        };
      }

      // Network error - retry
      console.warn(`[SecureFetch] ⚠️ Network error:`, err.message);
    }

    // Wait before retry (exponential backoff with jitter)
    if (attemptCount < retries) {
      const delay = retryDelay * Math.pow(2, attemptCount - 1);
      const jitter = Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  // All retries exhausted
  const duration = Date.now() - startTime;
  console.error(`[SecureFetch] ❌ All ${retries} attempts failed for ${method} ${url}`);

  return {
    success: false,
    statusCode: 0,
    headers: {},
    error: {
      code: 'MAX_RETRIES_EXCEEDED',
      message: `Failed after ${retries} attempts`,
      details: lastError,
    },
    metadata: {
      requestId,
      duration,
      retries: attemptCount - 1,
    },
  };
}

/**
 * Combine abort signals
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}
