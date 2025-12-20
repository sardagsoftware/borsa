/**
 * LYDIAN-IQ v3.0 - K6 Load Test: Chat Tool Call
 *
 * SLO Target: p95 < 2s
 * Load: Ramp 5→50 VUs, RPS burst=30
 * Duration: 5 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatResponseTime = new Trend('chat_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 VUs
    { duration: '1m', target: 10 },   // Ramp to 10 VUs
    { duration: '1m', target: 30 },   // Ramp to 30 VUs
    { duration: '1m', target: 50 },   // Peak at 50 VUs
    { duration: '1m', target: 30 },   // Ramp down to 30 VUs
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'], // p95 < 2s, p99 < 3s
    'errors': ['rate<0.01'], // Error rate < 1%
    'http_req_failed': ['rate<0.01'], // HTTP failures < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Sample prompts for testing
const prompts = [
  'Trendyol\'da en çok satan ürünleri analiz et',
  'Hepsiburada fiyat optimizasyonu öner',
  'Kargo takip bilgisi sorgula: SHIP-12345',
  'Ürün stok durumu kontrol et',
  'Fiyat elastisitesi hesapla',
];

export default function () {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  const payload = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'AX9F7E2B-sonnet-4-5',
    tools: [
      {
        name: 'economy_optimize',
        description: 'Optimize economy metrics',
      },
      {
        name: 'track_shipment',
        description: 'Track shipment status',
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'ChatToolCall' },
  };

  const startTime = new Date();
  const response = http.post(`${BASE_URL}/api/chat`, payload, params);
  const endTime = new Date();
  const duration = endTime - startTime;

  // Record metrics
  chatResponseTime.add(duration);

  // Validate response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has content': (r) => r.body && r.body.length > 0,
    'response time < 2s': (r) => duration < 2000,
  });

  errorRate.add(!success);

  // Simulate user think time (0.5-2s)
  sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
