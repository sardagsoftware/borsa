/**
 * LYDIAN-IQ PERFORMANCE TEST: Logistics Tracking
 *
 * Scenario: Real-time shipment tracking across multiple carriers
 * Target: p95 < 1s
 * Load: 20 RPS sustained
 * Duration: 3 minutes
 *
 * SLO Targets:
 * - p95 latency < 1000ms
 * - p99 latency < 1500ms
 * - Error rate < 0.5%
 * - Cache hit rate > 80%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const trackingErrors = new Rate('tracking_errors');
const trackingLatency = new Trend('tracking_latency');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Test configuration
export const options = {
  scenarios: {
    tracking_load: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 RPS
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 40,
      maxVUs: 100,
    },
  },
  thresholds: {
    'tracking_latency': ['p95<1000', 'p99<1500'], // p95 < 1s, p99 < 1.5s
    'tracking_errors': ['rate<0.005'], // < 0.5% error rate
    'http_req_duration': ['p95<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Mock tracking numbers for different vendors
const trackingData = [
  { vendor: 'aras', tracking_no: 'ARAS123456789' },
  { vendor: 'aras', tracking_no: 'ARAS987654321' },
  { vendor: 'yurtici', tracking_no: 'YK123456789' },
  { vendor: 'yurtici', tracking_no: 'YK987654321' },
  { vendor: 'ups', tracking_no: '1Z999AA10123456784' },
  { vendor: 'ups', tracking_no: '1Z999AA10987654321' },
  { vendor: 'hepsijet', tracking_no: 'HJ123456' },
  { vendor: 'hepsijet', tracking_no: 'HJ789012' },
  { vendor: 'mng', tracking_no: 'MNG123456789' },
  { vendor: 'mng', tracking_no: 'MNG987654321' },
  { vendor: 'surat', tracking_no: 'SR123456789' },
  { vendor: 'surat', tracking_no: 'SR987654321' },
];

export default function () {
  // Select random tracking number (80% reuse for cache testing)
  const useExisting = Math.random() < 0.8;
  const tracking = useExisting
    ? trackingData[Math.floor(Math.random() * trackingData.length)]
    : {
        vendor: 'aras',
        tracking_no: `ARAS${Date.now()}`,
      };

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': __ENV.API_KEY || 'test-key',
    },
    timeout: '5s',
  };

  const startTime = Date.now();

  // Send tracking request
  const res = http.get(
    `${BASE_URL}/api/logistics/track?vendor=${tracking.vendor}&tracking_no=${tracking.tracking_no}`,
    params
  );

  const duration = Date.now() - startTime;
  trackingLatency.add(duration);

  // Check for cache hit
  const cacheStatus = res.headers['X-Cache-Status'];
  if (cacheStatus === 'HIT') {
    cacheHits.add(1);
  } else {
    cacheMisses.add(1);
  }

  // Validate response
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has tracking_no': (r) => r.json('tracking_no') !== undefined,
    'has vendor': (r) => r.json('vendor') !== undefined,
    'has status': (r) => r.json('status') !== undefined,
    'has events': (r) => Array.isArray(r.json('events')),
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  trackingErrors.add(!success);

  // Validate tracking event structure
  if (res.status === 200) {
    const data = res.json();
    check(data, {
      'valid status': (d) =>
        ['created', 'label_ready', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'canceled'].includes(d.status),
      'events have timestamp': (d) =>
        d.events.length === 0 || d.events[0].timestamp !== undefined,
      'events have location': (d) =>
        d.events.length === 0 || d.events[0].location !== undefined,
    });
  }

  // Random think time (50-200ms)
  sleep(Math.random() * 0.15 + 0.05);
}

export function handleSummary(data) {
  const totalRequests = (data.metrics.cache_hits?.values?.count || 0) + (data.metrics.cache_misses?.values?.count || 0);
  const cacheHitRate = totalRequests > 0
    ? (data.metrics.cache_hits?.values?.count || 0) / totalRequests
    : 0;

  return {
    'stdout': JSON.stringify({
      test: 'track_logistics',
      timestamp: new Date().toISOString(),
      metrics: {
        tracking_latency_p95: data.metrics.tracking_latency?.values?.p95,
        tracking_latency_p99: data.metrics.tracking_latency?.values?.p99,
        tracking_latency_avg: data.metrics.tracking_latency?.values?.avg,
        error_rate: data.metrics.tracking_errors?.values?.rate || 0,
        throughput_rps: data.metrics.http_reqs?.values?.rate,
        cache_hit_rate: cacheHitRate,
        total_requests: totalRequests,
        cache_hits: data.metrics.cache_hits?.values?.count || 0,
        cache_misses: data.metrics.cache_misses?.values?.count || 0,
      },
      thresholds_passed: (data.metrics.tracking_latency?.thresholds?.['p95<1000']?.ok || false),
      slo_met:
        (data.metrics.tracking_latency?.values?.p95 || Infinity) < 1000 &&
        (data.metrics.tracking_errors?.values?.rate || 1) < 0.005 &&
        cacheHitRate > 0.80,
    }, null, 2),
    'docs/perf/track_logistics_report.json': JSON.stringify(data, null, 2),
  };
}
