/**
 * AI POWER PANEL - Metrics Fetchers
 * Fetch real telemetry from local models and Azure quotas
 *
 * SECURITY: SSRF allowlist, no credentials in UI, Vault-only
 * COMPLIANCE: KVKK/GDPR/PDPL - system metrics only, no PII
 */

import { AIModel } from './registry';
import { OperationalMetrics } from './formulas';

// SSRF Protection: Allowed origins only
const ALLOWED_ORIGINS = [
  'http://localhost:3100',
  'https://www.ailydian.com',
  'https://ailydian.com',
  'https://*.vercel.app' // Vercel deployments
];

/**
 * Validate origin for SSRF protection
 */
function validateOrigin(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_ORIGINS.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(urlObj.origin);
      }
      return urlObj.origin === allowed;
    });
  } catch {
    return false;
  }
}

/**
 * Fetch metrics for local models from telemetry API
 */
export async function fetchLocalMetrics(modelId: string): Promise<OperationalMetrics | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/telemetry/models/${modelId}`;

    if (!validateOrigin(apiUrl)) {
      console.error('SSRF Protection: Invalid origin blocked', apiUrl);
      return null;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Always get fresh data
    });

    if (!response.ok) {
      console.warn(`Telemetry API error for ${modelId}:`, response.status);
      return null;
    }

    const data = await response.json();
    return {
      tps: data.tps || null,
      p95_ms: data.p95_ms || data.latency_p95 || null,
    };
  } catch (error) {
    console.error(`Failed to fetch metrics for ${modelId}:`, error);
    return null;
  }
}

/**
 * Fetch Azure quotas (TPM, RPM, concurrency)
 * Uses backend service to protect credentials
 */
export async function fetchAzureQuotas(deployment: string): Promise<OperationalMetrics | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/azure/quotas?deployment=${encodeURIComponent(deployment)}`;

    if (!validateOrigin(apiUrl)) {
      console.error('SSRF Protection: Invalid origin blocked', apiUrl);
      return null;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`Azure quotas API error for ${deployment}:`, response.status);
      return null;
    }

    const data = await response.json();
    return {
      TPM: data.TPM || data.tokensPerMinute || null,
      RPM: data.RPM || data.requestsPerMinute || null,
      concurrency: data.concurrency || data.maxConcurrent || null,
      p95_ms: data.p95_ms || data.latency_p95 || null,
    };
  } catch (error) {
    console.error(`Failed to fetch Azure quotas for ${deployment}:`, error);
    return null;
  }
}

/**
 * Fetch all metrics for a model
 * Automatically chooses local or Azure based on provider
 */
export async function fetchModelMetrics(model: AIModel): Promise<OperationalMetrics | null> {
  if (model.provider === 'azure' && model.deployment) {
    return await fetchAzureQuotas(model.deployment);
  } else if (model.provider === 'local' || model.provider === 'groq') {
    return await fetchLocalMetrics(model.id);
  } else {
    // For OpenAI, Anthropic, Google - use local telemetry if available
    return await fetchLocalMetrics(model.id);
  }
}

/**
 * Fetch metrics for all models in parallel
 * Returns Map<modelId, metrics>
 */
export async function fetchAllMetrics(models: AIModel[]): Promise<Map<string, OperationalMetrics>> {
  const results = new Map<string, OperationalMetrics>();

  // Fetch in parallel for performance
  const promises = models.map(async (model) => {
    const metrics = await fetchModelMetrics(model);
    if (metrics) {
      results.set(model.id, metrics);
    }
  });

  await Promise.allSettled(promises); // Don't fail on individual errors
  return results;
}

/**
 * SWR (Stale-While-Revalidate) cache wrapper
 * Provides instant cached data while revalidating in background
 */
const metricsCache = new Map<string, {
  data: OperationalMetrics;
  timestamp: number;
}>();

const CACHE_TTL = 30000; // 30 seconds

export async function fetchModelMetricsWithCache(
  model: AIModel,
  maxAge: number = CACHE_TTL
): Promise<OperationalMetrics | null> {
  const cached = metricsCache.get(model.id);
  const now = Date.now();

  // Return cached if fresh
  if (cached && (now - cached.timestamp) < maxAge) {
    // Revalidate in background
    fetchModelMetrics(model).then(fresh => {
      if (fresh) {
        metricsCache.set(model.id, { data: fresh, timestamp: now });
      }
    }).catch(console.error);

    return cached.data;
  }

  // No cache or stale - fetch fresh
  const fresh = await fetchModelMetrics(model);
  if (fresh) {
    metricsCache.set(model.id, { data: fresh, timestamp: now });
  }

  return fresh;
}

/**
 * Clear metrics cache (for manual refresh)
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  models: string[];
  avgAge: number;
} {
  const now = Date.now();
  const entries = Array.from(metricsCache.entries());
  const avgAge = entries.length > 0
    ? entries.reduce((sum, [, v]) => sum + (now - v.timestamp), 0) / entries.length
    : 0;

  return {
    size: metricsCache.size,
    models: Array.from(metricsCache.keys()),
    avgAge: avgAge / 1000 // Convert to seconds
  };
}
