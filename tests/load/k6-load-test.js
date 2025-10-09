/**
 * K6 Load Testing Script
 * White-Hat Policy: Performance testing, no malicious traffic
 *
 * Run: k6 run tests/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp-up: 0 to 50 users over 30 seconds
    { duration: '30s', target: 50 },
    // Stay at 50 users for 2 minutes
    { duration: '2m', target: 50 },
    // Ramp-up: 50 to 100 users over 30 seconds
    { duration: '30s', target: 100 },
    // Stay at 100 users for 3 minutes
    { duration: '3m', target: 100 },
    // Ramp-down: 100 to 0 users over 30 seconds
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500'],
    // 99% of requests should complete within 1000ms
    'http_req_duration{name:cities_list}': ['p(99)<1000'],
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
    // Success rate should be greater than 99%
    success: ['rate>0.99'],
  },
};

// Environment variables
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.TEST_API_KEY || '';

// Test data
const testData = {
  cities: [
    {
      name: 'Istanbul',
      coordinates: { latitude: 41.0082, longitude: 28.9784 },
      population: 15840900,
      timezone: 'Europe/Istanbul',
    },
    {
      name: 'Ankara',
      coordinates: { latitude: 39.9334, longitude: 32.8597 },
      population: 5700000,
      timezone: 'Europe/Istanbul',
    },
    {
      name: 'Izmir',
      coordinates: { latitude: 38.4237, longitude: 27.1428 },
      population: 4400000,
      timezone: 'Europe/Istanbul',
    },
  ],
  personas: [
    {
      name: 'AI Asistan',
      personality: 'Yardımsever',
      expertise: ['teknoloji'],
      language: 'tr',
      description: 'K6 load test',
    },
  ],
  signals: [
    {
      signalType: 'market_event',
      source: 'k6_load_test',
      timestamp: new Date().toISOString(),
      payload: { price: 100, volume: 1000 },
    },
  ],
};

/**
 * Setup function (runs once per VU)
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`API Key: ${API_KEY ? 'Provided' : 'Missing'}`);
  return { startTime: new Date().toISOString() };
}

/**
 * Main test function (runs repeatedly)
 */
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  // Scenario selection (distribute load across endpoints)
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - List cities
    testListCities(headers);
  } else if (scenario < 0.7) {
    // 30% - Create city
    testCreateCity(headers);
  } else if (scenario < 0.85) {
    // 15% - List personas
    testListPersonas(headers);
  } else {
    // 15% - Ingest signal
    testIngestSignal(headers);
  }

  // Think time (simulate real user behavior)
  sleep(1 + Math.random() * 2);
}

/**
 * Test: List cities
 */
function testListCities(headers) {
  const startTime = new Date();

  const response = http.get(`${BASE_URL}/api/v1/smart-cities/cities?limit=50`, {
    headers,
    tags: { name: 'cities_list' },
  });

  const duration = new Date() - startTime;
  apiResponseTime.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has cities array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).cities);
      } catch {
        return false;
      }
    },
    'has rate limit headers': (r) =>
      r.headers['X-Ratelimit-Limit'] !== undefined &&
      r.headers['X-Ratelimit-Remaining'] !== undefined,
    'response time < 500ms': () => duration < 500,
  });

  if (success) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    console.error(`List cities failed: ${response.status} - ${response.body}`);
  }
}

/**
 * Test: Create city
 */
function testCreateCity(headers) {
  const city = testData.cities[Math.floor(Math.random() * testData.cities.length)];
  const idempotencyKey = `k6_${Date.now()}_${Math.random()}`;

  const startTime = new Date();

  const response = http.post(
    `${BASE_URL}/api/v1/smart-cities/cities`,
    JSON.stringify(city),
    {
      headers: {
        ...headers,
        'Idempotency-Key': idempotencyKey,
      },
      tags: { name: 'cities_create' },
    }
  );

  const duration = new Date() - startTime;
  apiResponseTime.add(duration);

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has cityId': (r) => {
      try {
        return JSON.parse(r.body).cityId !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 1000ms': () => duration < 1000,
  });

  if (success) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    if (response.status !== 409) {
      // 409 is expected for duplicate idempotency key
      console.error(`Create city failed: ${response.status} - ${response.body}`);
    }
  }
}

/**
 * Test: List personas
 */
function testListPersonas(headers) {
  const languages = ['tr', 'en', 'de', 'fr', 'es'];
  const language = languages[Math.floor(Math.random() * languages.length)];

  const startTime = new Date();

  const response = http.get(
    `${BASE_URL}/api/v1/insan-iq/personas?language=${language}&limit=20`,
    {
      headers,
      tags: { name: 'personas_list' },
    }
  );

  const duration = new Date() - startTime;
  apiResponseTime.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has personas array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).personas);
      } catch {
        return false;
      }
    },
    'response time < 500ms': () => duration < 500,
  });

  if (success) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    console.error(`List personas failed: ${response.status}`);
  }
}

/**
 * Test: Ingest signal
 */
function testIngestSignal(headers) {
  const signal = {
    ...testData.signals[0],
    timestamp: new Date().toISOString(),
    payload: {
      price: 100 + Math.random() * 1000,
      volume: Math.floor(Math.random() * 10000),
    },
  };
  const idempotencyKey = `k6_signal_${Date.now()}_${Math.random()}`;

  const startTime = new Date();

  const response = http.post(`${BASE_URL}/api/v1/lydian-iq/signals`, JSON.stringify(signal), {
    headers: {
      ...headers,
      'Idempotency-Key': idempotencyKey,
    },
    tags: { name: 'signals_ingest' },
  });

  const duration = new Date() - startTime;
  apiResponseTime.add(duration);

  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'has signalId': (r) => {
      try {
        return JSON.parse(r.body).signalId !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 1000ms': () => duration < 1000,
  });

  if (success) {
    successRate.add(1);
  } else {
    errorRate.add(1);
    if (response.status !== 409) {
      console.error(`Ingest signal failed: ${response.status}`);
    }
  }
}

/**
 * Teardown function (runs once at the end)
 */
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}

/**
 * Handle summary (custom test report)
 */
export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}✓ Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += `${indent}✓ Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}✓ Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `${indent}✓ Success Rate: ${((1 - data.metrics.errors.values.rate) * 100).toFixed(2)}%\n`;
  summary += `${indent}✓ Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  summary += `${indent}✓ Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}✓ P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}✓ P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;

  return summary;
}
