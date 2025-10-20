// ========================================
// METRICS CONTROLLER
// /metrics endpoint - Prometheus-compatible metrics
// SPRINT 0 - DoD Requirement
// ========================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { actionRegistry, capabilityRegistry } from '@lydian/app-sdk';

// In-memory metrics store (simple implementation)
// TODO: Replace with prom-client library for production
class MetricsCollector {
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;
  private totalLatency = 0;
  private rateLimitCount = 0;

  recordRequest(success: boolean, latency: number, rateLimited = false) {
    this.requestCount++;
    if (success) this.successCount++;
    else this.errorCount++;
    this.totalLatency += latency;
    if (rateLimited) this.rateLimitCount++;
  }

  getMetrics() {
    return {
      requests_total: this.requestCount,
      requests_success_total: this.successCount,
      requests_error_total: this.errorCount,
      requests_rate_limited_total: this.rateLimitCount,
      avg_latency_ms: this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      success_ratio: this.requestCount > 0 ? this.successCount / this.requestCount : 0,
    };
  }

  reset() {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalLatency = 0;
    this.rateLimitCount = 0;
  }
}

export const metricsCollector = new MetricsCollector();

/**
 * Metrics Handler
 * GET /metrics
 *
 * SPRINT 0 DoD: Must expose Prometheus-compatible metrics
 *
 * Metrics exposed:
 * - lydian_requests_total
 * - lydian_requests_success_total
 * - lydian_requests_error_total
 * - lydian_requests_rate_limited_total
 * - lydian_avg_latency_ms
 * - lydian_success_ratio
 * - lydian_connectors_total
 * - lydian_actions_total
 */
export async function metricsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const metrics = metricsCollector.getMetrics();
  const summary = capabilityRegistry.getSummary();
  const actions = actionRegistry.getActions();

  // Prometheus format
  const prometheusMetrics = `# HELP lydian_requests_total Total number of requests
# TYPE lydian_requests_total counter
lydian_requests_total ${metrics.requests_total}

# HELP lydian_requests_success_total Total number of successful requests
# TYPE lydian_requests_success_total counter
lydian_requests_success_total ${metrics.requests_success_total}

# HELP lydian_requests_error_total Total number of failed requests
# TYPE lydian_requests_error_total counter
lydian_requests_error_total ${metrics.requests_error_total}

# HELP lydian_requests_rate_limited_total Total number of rate-limited requests
# TYPE lydian_requests_rate_limited_total counter
lydian_requests_rate_limited_total ${metrics.requests_rate_limited_total}

# HELP lydian_avg_latency_ms Average latency in milliseconds
# TYPE lydian_avg_latency_ms gauge
lydian_avg_latency_ms ${metrics.avg_latency_ms.toFixed(2)}

# HELP lydian_success_ratio Ratio of successful requests
# TYPE lydian_success_ratio gauge
lydian_success_ratio ${metrics.success_ratio.toFixed(4)}

# HELP lydian_connectors_total Total number of registered connectors
# TYPE lydian_connectors_total gauge
lydian_connectors_total ${summary.total}

# HELP lydian_connectors_production_ready Number of production-ready connectors
# TYPE lydian_connectors_production_ready gauge
lydian_connectors_production_ready ${summary.productionReady}

# HELP lydian_actions_total Total number of available actions
# TYPE lydian_actions_total gauge
lydian_actions_total ${actions.length}

# HELP lydian_up Service up status (1 = up, 0 = down)
# TYPE lydian_up gauge
lydian_up 1
`;

  reply.header('Content-Type', 'text/plain; version=0.0.4');
  return reply.send(prometheusMetrics);
}
