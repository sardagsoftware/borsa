/**
 * LYDIAN-IQ v3.0 - K6 Load Test: Logistics Tracking
 *
 * SLO Target: p95 < 1s
 * Load: 20 RPS sustained
 * Duration: 5 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('tracking_errors');
const trackingDuration = new Trend('tracking_duration');
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');

// Test configuration
export const options = {
  scenarios: {
    tracking: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 RPS
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // p95 < 1s
    'tracking_errors': ['rate<0.01'], // Error rate < 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Shipment IDs for testing (mix of fresh and repeated for cache testing)
const shipmentIds = [
  'SHIP-12345', 'SHIP-12346', 'SHIP-12347', 'SHIP-12348', 'SHIP-12349',
  'SHIP-12350', 'SHIP-12351', 'SHIP-12352', 'SHIP-12353', 'SHIP-12354',
];

const carriers = ['aras', 'yurtici', 'ups', 'mng', 'surat'];

export default function () {
  // 70% chance to use a repeated ID (test cache)
  const useRepeatedId = Math.random() < 0.7;
  const shipmentId = useRepeatedId 
    ? shipmentIds[Math.floor(Math.random() * shipmentIds.length)]
    : 'SHIP-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

  const carrier = carriers[Math.floor(Math.random() * carriers.length)];

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'TrackLogistics', carrier: carrier },
  };

  const startTime = new Date();
  const response = http.get(BASE_URL + '/api/logistics/track/' + carrier + '/' + shipmentId, params);
  const endTime = new Date();
  const duration = endTime - startTime;

  // Record metrics
  trackingDuration.add(duration);

  // Check for cache hit (presence of X-Cache-Hit header or fast response)
  const isCacheHit = duration < 100 || (response.headers['X-Cache-Hit'] === 'true');
  if (isCacheHit) {
    cacheHits.add(1);
  } else {
    cacheMisses.add(1);
  }

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'tracking data present': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 1s': (r) => duration < 1000,
  });

  errorRate.add(!success);

  // Minimal sleep for high RPS
  sleep(0.1);
}

export function handleSummary(data) {
  const cacheHitRate = data.metrics.cache_hits 
    ? (data.metrics.cache_hits.values.count / (data.metrics.cache_hits.values.count + data.metrics.cache_misses.values.count)) * 100
    : 0;

  console.log('Cache Hit Rate: ' + cacheHitRate.toFixed(2) + '%');

  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
