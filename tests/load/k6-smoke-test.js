/**
 * K6 Smoke Testing Script
 * Quick sanity check with minimal load
 *
 * Run: k6 run tests/load/k6-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // 1 virtual user
  duration: '1m', // Run for 1 minute
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests should be below 1s
    http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.TEST_API_KEY || '';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  // Test 1: List cities
  let response = http.get(`${BASE_URL}/api/v1/smart-cities/cities?limit=10`, { headers });
  check(response, {
    'list cities status is 200': (r) => r.status === 200,
    'list cities has data': (r) => JSON.parse(r.body).cities !== undefined,
  });

  sleep(1);

  // Test 2: List personas
  response = http.get(`${BASE_URL}/api/v1/insan-iq/personas?limit=10`, { headers });
  check(response, {
    'list personas status is 200': (r) => r.status === 200,
    'list personas has data': (r) => JSON.parse(r.body).personas !== undefined,
  });

  sleep(1);

  // Test 3: List signals
  response = http.get(`${BASE_URL}/api/v1/lydian-iq/signals?limit=10`, { headers });
  check(response, {
    'list signals status is 200': (r) => r.status === 200,
    'list signals has data': (r) => JSON.parse(r.body).signals !== undefined,
  });

  sleep(1);
}
