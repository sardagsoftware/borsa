/**
 * LYDIAN-IQ PERFORMANCE TEST: Batch Product Sync
 *
 * Scenario: E-commerce batch product synchronization (100 products)
 * Target: p95 < 120s (2 minutes)
 * Load: 5 concurrent batch operations
 * Duration: 5 minutes
 *
 * SLO Targets:
 * - p95 latency < 120000ms (2 minutes)
 * - p99 latency < 180000ms (3 minutes)
 * - Error rate < 0.5%
 * - Success rate > 99%
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const batchSuccessRate = new Rate('batch_success');
const batchDuration = new Trend('batch_duration');
const productsProcessed = new Counter('products_processed');
const batchErrors = new Counter('batch_errors');

// Test configuration
export const options = {
  scenarios: {
    batch_sync: {
      executor: 'constant-vus',
      vus: 5, // 5 concurrent batch operations
      duration: '5m',
    },
  },
  thresholds: {
    'batch_duration': ['p95<120000', 'p99<180000'], // p95 < 2min, p99 < 3min
    'batch_success': ['rate>0.99'], // > 99% success rate
    'batch_errors': ['count<5'], // < 5 total errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// Generate mock product data
function generateProducts(count = 100) {
  const products = [];
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Toys'];
  const brands = ['BrandA', 'BrandB', 'BrandC', 'BrandD', 'BrandE'];

  for (let i = 0; i < count; i++) {
    products.push({
      id: `PROD-${Date.now()}-${i}`,
      name: `Product ${i}`,
      category: categories[i % categories.length],
      brand: brands[i % brands.length],
      price: Math.floor(Math.random() * 1000) + 10,
      currency: 'TRY',
      stock: Math.floor(Math.random() * 100),
      description: `This is product number ${i} with various features`,
      images: [
        `https://example.com/images/product-${i}-1.jpg`,
        `https://example.com/images/product-${i}-2.jpg`,
      ],
      attributes: {
        weight_kg: Math.random() * 10,
        length_cm: Math.floor(Math.random() * 100),
        width_cm: Math.floor(Math.random() * 100),
        height_cm: Math.floor(Math.random() * 100),
      },
      tags: [`tag${i % 5}`, `tag${i % 7}`, `tag${i % 11}`],
      active: true,
    });
  }

  return products;
}

export default function () {
  const batchId = `BATCH-${Date.now()}-${__VU}`;

  group('Batch Product Sync', () => {
    // Step 1: Initialize batch
    const initPayload = JSON.stringify({
      batch_id: batchId,
      operation: 'product_sync',
      mode: 'upsert',
      total_items: 100,
    });

    const initRes = http.post(
      `${BASE_URL}/api/batch/init`,
      initPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': __ENV.API_KEY || 'test-key',
        },
        timeout: '5s',
      }
    );

    check(initRes, {
      'batch init success': (r) => r.status === 201,
      'batch init has id': (r) => r.json('batch_id') !== undefined,
    });

    if (initRes.status !== 201) {
      batchErrors.add(1);
      return;
    }

    // Step 2: Upload products in chunks (10 products per chunk)
    const products = generateProducts(100);
    const chunkSize = 10;
    const startTime = Date.now();

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);

      const uploadPayload = JSON.stringify({
        batch_id: batchId,
        chunk_index: Math.floor(i / chunkSize),
        products: chunk,
      });

      const uploadRes = http.post(
        `${BASE_URL}/api/batch/upload`,
        uploadPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': __ENV.API_KEY || 'test-key',
          },
          timeout: '30s',
        }
      );

      const chunkSuccess = check(uploadRes, {
        'chunk upload success': (r) => r.status === 200,
        'chunk processed': (r) => r.json('processed_count') > 0,
      });

      if (chunkSuccess) {
        productsProcessed.add(chunk.length);
      } else {
        batchErrors.add(1);
      }

      // Small delay between chunks
      sleep(0.1);
    }

    // Step 3: Commit batch
    const commitPayload = JSON.stringify({
      batch_id: batchId,
      finalize: true,
    });

    const commitRes = http.post(
      `${BASE_URL}/api/batch/commit`,
      commitPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': __ENV.API_KEY || 'test-key',
        },
        timeout: '60s',
      }
    );

    const duration = Date.now() - startTime;
    batchDuration.add(duration);

    const finalSuccess = check(commitRes, {
      'batch commit success': (r) => r.status === 200,
      'batch completed': (r) => r.json('status') === 'completed',
      'all products synced': (r) => r.json('processed_count') === 100,
      'batch completed in < 2min': (r) => duration < 120000,
    });

    batchSuccessRate.add(finalSuccess);

    if (!finalSuccess) {
      batchErrors.add(1);
      console.error(`Batch ${batchId} failed after ${duration}ms`);
    }
  });

  // Wait before next batch (5-10 seconds)
  sleep(Math.random() * 5 + 5);
}

export function handleSummary(data) {
  const batchCount = data.metrics.batch_duration?.values?.count || 0;
  const successRate = data.metrics.batch_success?.values?.rate || 0;
  const productsTotal = data.metrics.products_processed?.values?.count || 0;

  return {
    'stdout': JSON.stringify({
      test: 'batch_sync',
      timestamp: new Date().toISOString(),
      metrics: {
        batch_duration_p95: data.metrics.batch_duration?.values?.p95,
        batch_duration_p99: data.metrics.batch_duration?.values?.p99,
        batch_duration_avg: data.metrics.batch_duration?.values?.avg,
        batch_success_rate: successRate,
        total_batches: batchCount,
        total_products_processed: productsTotal,
        products_per_second: productsTotal / (data.state.testRunDurationMs / 1000),
        error_count: data.metrics.batch_errors?.values?.count || 0,
      },
      thresholds_passed: (data.metrics.batch_duration?.thresholds?.['p95<120000']?.ok || false),
      slo_met: successRate > 0.99 && (data.metrics.batch_duration?.values?.p95 || Infinity) < 120000,
    }, null, 2),
    'docs/perf/batch_sync_report.json': JSON.stringify(data, null, 2),
  };
}
