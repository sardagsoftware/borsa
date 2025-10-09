/**
 * LYDIAN-IQ PERFORMANCE TEST: Chat Tool Call
 *
 * Scenario: AI assistant chat with tool calling (real-time interaction)
 * Target: p95 < 2s
 * Load: 10 RPS sustained, 30 RPS burst
 * Duration: 2 minutes
 *
 * SLO Targets:
 * - p95 latency < 2000ms
 * - p99 latency < 3000ms
 * - Error rate < 1%
 * - Throughput > 9 RPS (sustained)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const chatLatency = new Trend('chat_latency');

// Test configuration
export const options = {
  scenarios: {
    sustained_load: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 RPS
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
    burst_load: {
      executor: 'constant-arrival-rate',
      rate: 30, // 30 RPS burst
      timeUnit: '1s',
      duration: '30s',
      startTime: '1m', // Start after sustained load
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    'http_req_duration{scenario:sustained_load}': ['p95<2000', 'p99<3000'],
    'http_req_duration{scenario:burst_load}': ['p95<2500', 'p99<4000'], // Relaxed for burst
    'errors': ['rate<0.01'], // < 1% error rate
    'http_reqs': ['rate>9'], // > 9 RPS throughput
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Test data: Chat messages
const chatMessages = [
  'Merhaba! Ankara\'dan İstanbul\'a bir kargo göndermek istiyorum.',
  'En hızlı teslimat seçeneği nedir?',
  'What is the weather like in Istanbul today?',
  'Calculate the shipping cost for a 5kg package to Izmir',
  'Track my shipment ARAS123456789',
  'Ne zaman teslim edilecek?',
  'Can you recommend a good restaurant in Kadıköy?',
  'Sipariş durumu nedir?',
  'I need help with my order ORD-12345',
  'Türkiye\'de en popüler e-ticaret siteleri hangileridir?',
];

export default function () {
  // Select random chat message
  const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];

  // Prepare chat request
  const payload = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        input_schema: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            country: { type: 'string' },
          },
          required: ['city'],
        },
      },
      {
        name: 'track_shipment',
        description: 'Track logistics shipment',
        input_schema: {
          type: 'object',
          properties: {
            tracking_no: { type: 'string' },
            vendor: {
              type: 'string',
              enum: ['aras', 'yurtici', 'ups', 'hepsijet', 'mng', 'surat'],
            },
          },
          required: ['tracking_no', 'vendor'],
        },
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': __ENV.API_KEY || 'test-key',
    },
    timeout: '10s',
  };

  // Send chat request
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/chat`, payload, params);
  const duration = Date.now() - startTime;

  // Record metrics
  chatLatency.add(duration);

  // Validate response
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response has content': (r) => r.json('content') !== undefined,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'no server errors': (r) => r.status < 500,
  });

  errorRate.add(!success);

  // If tool call is triggered, verify tool response
  if (res.status === 200 && res.json('tool_calls')) {
    const toolCalls = res.json('tool_calls');
    check(toolCalls, {
      'tool calls present': (tc) => Array.isArray(tc) && tc.length > 0,
      'tool call has name': (tc) => tc[0]?.function?.name !== undefined,
    });
  }

  // Random think time between requests (100-500ms)
  sleep(Math.random() * 0.4 + 0.1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      test: 'chat_tool_call',
      timestamp: new Date().toISOString(),
      metrics: {
        http_req_duration_p95: data.metrics.http_req_duration.values.p95,
        http_req_duration_p99: data.metrics.http_req_duration.values.p99,
        http_req_duration_avg: data.metrics.http_req_duration.values.avg,
        error_rate: data.metrics.errors.values.rate,
        throughput_rps: data.metrics.http_reqs.values.rate,
        chat_latency_p95: data.metrics.chat_latency.values.p95,
      },
      thresholds_passed: data.metrics.http_req_duration.thresholds['p95<2000'].ok,
    }, null, 2),
    'docs/perf/chat_tool_call_report.json': JSON.stringify(data, null, 2),
  };
}
