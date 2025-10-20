/**
 * LYDIAN-IQ v3.0 - K6 Load Test: Batch Product Sync
 *
 * SLO Target: p95 < 120s (100 products)
 * Load: 5 concurrent batch operations
 * Duration: 10 minutes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('batch_errors');
const batchDuration = new Trend('batch_duration');

// Test configuration
export const options = {
  scenarios: {
    batch_sync: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<120000'], // p95 < 120s
    'batch_errors': ['rate<0.01'], // Error rate < 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Generate synthetic product data
function generateProducts(count) {
  const products = [];
  const timestamp = Date.now();
  for (let i = 0; i < count; i++) {
    products.push({
      sku: 'PRD-' + timestamp + '-' + i,
      name: 'Test Product ' + i,
      price: Math.random() * 1000 + 10,
      stock: Math.floor(Math.random() * 100),
      category: ['Electronics', 'Fashion', 'Home', 'Books'][Math.floor(Math.random() * 4)],
      brand: ['BrandA', 'BrandB', 'BrandC'][Math.floor(Math.random() * 3)],
    });
  }
  return products;
}

export default function () {
  const batchSize = Math.random() > 0.5 ? 100 : 500; // Test both 100 and 500 item batches
  const products = generateProducts(batchSize);

  const payload = JSON.stringify({
    operation: 'upsert',
    products: products,
    channel: ['trendyol', 'hepsiburada'][Math.floor(Math.random() * 2)],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'BatchSync', batch_size: batchSize },
    timeout: '180s', // 3 minute timeout
  };

  const startTime = new Date();
  const response = http.post(BASE_URL + '/api/products/batch', payload, params);
  const endTime = new Date();
  const duration = endTime - startTime;

  // Record metrics
  batchDuration.add(duration);

  // Validate response
  const success = check(response, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'batch ID returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.batch_id !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 120s': (r) => duration < 120000,
  });

  errorRate.add(!success);

  // Wait between batches (5-10s)
  sleep(Math.random() * 5 + 5);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
