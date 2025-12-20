/**
 * ============================================================================
 * K6 LOAD TESTING SUITE
 * ============================================================================
 * Purpose: Load test Ailydian Ultra Pro at 200-500 RPS
 * Metrics: Response time, error rate, throughput
 * Duration: 10 minutes with ramp-up
 * ============================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCounter = new Counter('requests_total');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 RPS
    { duration: '3m', target: 200 },   // Ramp up to 200 RPS
    { duration: '3m', target: 500 },   // Ramp up to 500 RPS (peak)
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],  // 95% of requests < 200ms
    'http_req_failed': ['rate<0.01'],     // Error rate < 1%
    'errors': ['rate<0.005'],             // Custom error rate < 0.5%
  },
};

// Base URL from environment
const BASE_URL = __ENV.BASE_URL || 'https://ailydian.com';

// Test scenarios
export default function() {
  const scenarios = [
    testHealthCheck,
    testAuth,
    testAIChat,
    testFileUpload,
    testDashboard
  ];

  // Randomly select a scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(1); // 1 second think time
}

/**
 * Scenario 1: Health Check
 */
function testHealthCheck() {
  const startTime = Date.now();

  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'HealthCheck' },
  });

  const duration = Date.now() - startTime;
  apiLatency.add(duration);
  requestCounter.add(1);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has status': (r) => r.json('status') !== undefined,
  });

  errorRate.add(!success);
}

/**
 * Scenario 2: Authentication
 */
function testAuth() {
  const startTime = Date.now();

  const payload = JSON.stringify({
    email: `testuser${Math.floor(Math.random() * 1000)}@ailydian.com`,
    password: 'TestPassword123!'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': 'test-token-' + Date.now(),
    },
    tags: { name: 'Auth' },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  const duration = Date.now() - startTime;
  apiLatency.add(duration);
  requestCounter.add(1);

  const success = check(res, {
    'status is 200 or 401': (r) => [200, 401].includes(r.status),
  });

  errorRate.add(!success);
}

/**
 * Scenario 3: AI Chat
 */
function testAIChat() {
  const startTime = Date.now();

  const payload = JSON.stringify({
    model: 'OX1D4A7F',
    messages: [
      { role: 'user', content: 'What is the weather like today?' }
    ],
    max_tokens: 100
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token-' + Date.now(),
      'Idempotency-Key': generateUUID(),
      'X-Estimated-Tokens': '150',
    },
    tags: { name: 'AIChat' },
    timeout: '30s',
  };

  const res = http.post(`${BASE_URL}/api/ai/chat`, payload, params);

  const duration = Date.now() - startTime;
  apiLatency.add(duration);
  requestCounter.add(1);

  const success = check(res, {
    'status is 200 or 429': (r) => [200, 429].includes(r.status),
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  errorRate.add(!success);
}

/**
 * Scenario 4: File Upload
 */
function testFileUpload() {
  const startTime = Date.now();

  // Generate random 1MB file
  const fileData = generateRandomData(1024 * 1024);

  const params = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Idempotency-Key': generateUUID(),
    },
    tags: { name: 'FileUpload' },
  };

  const res = http.post(`${BASE_URL}/api/upload`, {
    file: http.file(fileData, 'test-file.txt', 'text/plain'),
  }, params);

  const duration = Date.now() - startTime;
  apiLatency.add(duration);
  requestCounter.add(1);

  const success = check(res, {
    'status is 200 or 413': (r) => [200, 413].includes(r.status),
  });

  errorRate.add(!success);
}

/**
 * Scenario 5: Dashboard
 */
function testDashboard() {
  const startTime = Date.now();

  const res = http.get(`${BASE_URL}/dashboard`, {
    tags: { name: 'Dashboard' },
  });

  const duration = Date.now() - startTime;
  apiLatency.add(duration);
  requestCounter.add(1);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'page loads in < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

/**
 * Helper: Generate UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Helper: Generate random data
 */
function generateRandomData(size) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Setup function (runs once)
 */
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Target: 200-500 RPS');
  console.log('Duration: 10 minutes');

  // Warm up
  http.get(`${BASE_URL}/api/health`);
}

/**
 * Teardown function (runs once)
 */
export function teardown(data) {
  console.log('Load test completed');
}
