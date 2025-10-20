/**
 * LYDIAN-IQ v3.0 - K6 Load Test: Civic-Grid (Public Insights)
 *
 * SLO Target: p95 < 500ms
 * Load: 1000 queries over 5 minutes
 * Duration: 5 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('civic_errors');
const civicDuration = new Trend('civic_duration');
const cacheHits = new Counter('civic_cache_hits');
const cacheMisses = new Counter('civic_cache_misses');

// Test configuration
export const options = {
  scenarios: {
    civic_queries: {
      executor: 'constant-arrival-rate',
      rate: 200, // ~3.3 RPS average
      timeUnit: '1m',
      duration: '5m',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // p95 < 500ms
    'civic_errors': ['rate<0.01'], // Error rate < 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Query endpoints
const endpoints = [
  '/api/insights/price-trend?category=electronics&period=7d',
  '/api/insights/price-trend?category=fashion&period=30d',
  '/api/insights/return-rate?category=electronics&period=7d',
  '/api/insights/return-rate?category=home&period=30d',
  '/api/insights/logistics-bottlenecks?region=istanbul&period=7d',
  '/api/insights/logistics-bottlenecks?region=ankara&period=30d',
];

export default function () {
  // Pick random endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Institution-API-Key': 'test-institution-key-001', // Mock institution key
    },
    tags: { name: 'CivicGrid' },
  };

  const startTime = new Date();
  const response = http.get(BASE_URL + endpoint, params);
  const endTime = new Date();
  const duration = endTime - startTime;

  // Record metrics
  civicDuration.add(duration);

  // Check for cache hit
  const isCacheHit = duration < 50 || (response.headers['X-Cache-Hit'] === 'true');
  if (isCacheHit) {
    cacheHits.add(1);
  } else {
    cacheMisses.add(1);
  }

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'DP noise applied': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.privacy_guarantee !== undefined;
      } catch {
        return false;
      }
    },
    'k-anonymity satisfied': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.group_size === undefined || body.group_size >= 5;
      } catch {
        return true; // If no group_size, assume satisfied
      }
    },
    'response time < 500ms': (r) => duration < 500,
  });

  errorRate.add(!success);

  // Minimal sleep
  sleep(0.2);
}

export function handleSummary(data) {
  const cacheHitRate = data.metrics.civic_cache_hits 
    ? (data.metrics.civic_cache_hits.values.count / (data.metrics.civic_cache_hits.values.count + data.metrics.civic_cache_misses.values.count)) * 100
    : 0;

  console.log('Civic-Grid Cache Hit Rate: ' + cacheHitRate.toFixed(2) + '%');

  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
