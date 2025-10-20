/**
 * API Client with Throttling and Retry Logic
 * Handles 429 rate limits and concurrent request management
 */

import { withCsrf } from './csrf';

const MAX_CONCURRENT = Number(process.env.NEXT_PUBLIC_MAX_CONCURRENT) || 4;
let activeRequests = 0;
const waitQueue: Array<() => void> = [];

/**
 * Throttle function to limit concurrent requests
 */
async function throttle<T>(fn: () => Promise<T>): Promise<T> {
  // Wait if max concurrent requests reached
  if (activeRequests >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waitQueue.push(resolve));
  }

  activeRequests++;

  try {
    return await fn();
  } finally {
    activeRequests = Math.max(0, activeRequests - 1);
    const next = waitQueue.shift();
    if (next) next();
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipThrottle?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
}

/**
 * Enhanced fetch with throttling, CSRF, and retry logic
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const {
    skipThrottle = false,
    skipRetry = false,
    maxRetries = 1,
    headers = {},
    ...fetchOptions
  } = options;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3100';
  const url = `${apiBase}${path}`;

  const executeRequest = async (): Promise<Response> => {
    // Add CSRF token to headers
    const headersWithCsrf = await withCsrf(headers);

    const response = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      headers: headersWithCsrf,
    });

    // Handle 429 rate limit
    if (response.status === 429 && !skipRetry) {
      const retryAfter = Number(response.headers.get('Retry-After') || 1);
      const jitter = Math.random() * 500; // Add jitter to prevent thundering herd

      console.warn(\`Rate limited. Retrying after \${retryAfter}s...\`);

      await new Promise((resolve) =>
        setTimeout(resolve, (retryAfter * 1000) + jitter)
      );

      // Single retry
      return executeRequest();
    }

    // Handle 503 with exponential backoff
    if (response.status === 503 && !skipRetry && maxRetries > 0) {
      const backoff = Math.pow(2, maxRetries) * 1000;

      console.warn(\`Service unavailable. Retrying in \${backoff}ms...\`);

      await new Promise((resolve) => setTimeout(resolve, backoff));

      return apiFetch(path, { ...options, maxRetries: maxRetries - 1 });
    }

    return response;
  };

  // Execute with or without throttling
  if (skipThrottle) {
    return executeRequest();
  } else {
    return throttle(executeRequest);
  }
}
