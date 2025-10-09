/**
 * E2E Tests: API Endpoints
 * White-Hat Policy: Real end-to-end scenarios
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_API_KEY = process.env.TEST_API_KEY || '';

test.describe('Smart Cities API E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let createdCityId: string;

  test('should create a new city', async ({ request }) => {
    const idempotencyKey = crypto.randomUUID();

    const response = await request.post(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': idempotencyKey,
      },
      data: {
        name: 'Istanbul E2E Test',
        coordinates: {
          latitude: 41.0082,
          longitude: 28.9784,
        },
        population: 15840900,
        timezone: 'Europe/Istanbul',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.cityId).toBeDefined();
    expect(body.name).toBe('Istanbul E2E Test');
    expect(body.coordinates.latitude).toBe(41.0082);
    expect(body.coordinates.longitude).toBe(28.9784);

    createdCityId = body.cityId;
  });

  test('should list cities with pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'X-API-Key': TEST_API_KEY,
      },
      params: {
        limit: '10',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.cities).toBeDefined();
    expect(Array.isArray(body.cities)).toBeTruthy();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.limit).toBe(10);

    // Check rate limit headers
    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });

  test('should get city by ID', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/smart-cities/cities/${createdCityId}`,
      {
        headers: {
          'X-API-Key': TEST_API_KEY,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.cityId).toBe(createdCityId);
    expect(body.name).toBe('Istanbul E2E Test');
  });

  test('should get city metrics', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/smart-cities/cities/${createdCityId}/metrics`,
      {
        headers: {
          'X-API-Key': TEST_API_KEY,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.cityId).toBe(createdCityId);
    expect(body.metrics).toBeDefined();
  });

  test('should handle idempotency correctly', async ({ request }) => {
    const idempotencyKey = crypto.randomUUID();

    // First request
    const response1 = await request.post(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': idempotencyKey,
      },
      data: {
        name: 'Ankara Idempotency Test',
        coordinates: { latitude: 39.9334, longitude: 32.8597 },
        population: 5700000,
        timezone: 'Europe/Istanbul',
      },
    });

    expect(response1.status()).toBe(201);

    // Second request with same idempotency key
    const response2 = await request.post(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': idempotencyKey,
      },
      data: {
        name: 'Ankara Idempotency Test',
        coordinates: { latitude: 39.9334, longitude: 32.8597 },
        population: 5700000,
        timezone: 'Europe/Istanbul',
      },
    });

    expect(response2.status()).toBe(409);

    const body = await response2.json();
    expect(body.error.code).toBe('DUPLICATE_REQUEST');
  });

  test('should validate coordinates', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        name: 'Invalid City',
        coordinates: { latitude: 999, longitude: 999 }, // Invalid
        population: 1000000,
        timezone: 'Europe/Istanbul',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

test.describe('İnsan IQ API E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let createdPersonaId: string;

  test('should create a new persona', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/insan-iq/personas`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        name: 'AI Asistan E2E',
        personality: 'Yardımsever ve bilgili',
        expertise: ['teknoloji', 'yazılım', 'yapay zeka'],
        language: 'tr',
        description: 'E2E test için oluşturulmuş AI asistan',
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.personaId).toBeDefined();
    expect(body.name).toBe('AI Asistan E2E');
    expect(body.language).toBe('tr');

    createdPersonaId = body.personaId;
  });

  test('should list personas with language filter', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/insan-iq/personas`, {
      headers: {
        'X-API-Key': TEST_API_KEY,
      },
      params: {
        language: 'tr',
        limit: '20',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.personas).toBeDefined();
    expect(Array.isArray(body.personas)).toBeTruthy();

    // Verify all personas have Turkish language
    body.personas.forEach((persona: any) => {
      expect(persona.language).toBe('tr');
    });
  });

  test('should get persona by ID', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/insan-iq/personas/${createdPersonaId}`,
      {
        headers: {
          'X-API-Key': TEST_API_KEY,
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.personaId).toBe(createdPersonaId);
    expect(body.name).toBe('AI Asistan E2E');
  });

  test('should validate language code', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/insan-iq/personas`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        name: 'Invalid Persona',
        personality: 'Test',
        expertise: ['test'],
        language: 'invalid_language', // Invalid
        description: 'Test',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

test.describe('LyDian IQ API E2E Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let createdSignalId: string;

  test('should ingest a signal', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/lydian-iq/signals`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        signalType: 'market_event',
        source: 'e2e_test',
        timestamp: new Date().toISOString(),
        payload: {
          symbol: 'BTC/USD',
          price: 50000,
          volume: 1000,
        },
        metadata: {
          testRun: true,
        },
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.signalId).toBeDefined();
    expect(body.signalType).toBe('market_event');
    expect(body.source).toBe('e2e_test');

    createdSignalId = body.signalId;
  });

  test('should list signals with pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/lydian-iq/signals`, {
      headers: {
        'X-API-Key': TEST_API_KEY,
      },
      params: {
        limit: '50',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.signals).toBeDefined();
    expect(Array.isArray(body.signals)).toBeTruthy();
    expect(body.pagination).toBeDefined();
  });

  test('should filter signals by type', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/lydian-iq/signals`, {
      headers: {
        'X-API-Key': TEST_API_KEY,
      },
      params: {
        signalType: 'market_event',
        limit: '20',
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.signals).toBeDefined();

    // Verify all signals are market_event type
    body.signals.forEach((signal: any) => {
      expect(signal.signalType).toBe('market_event');
    });
  });

  test('should validate required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/lydian-iq/signals`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TEST_API_KEY,
        'Idempotency-Key': crypto.randomUUID(),
      },
      data: {
        // Missing signalType, source, timestamp, payload
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
  });
});

test.describe('Authentication E2E Tests', () => {
  test('should reject request without API key', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/smart-cities/cities`);

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('MISSING_API_KEY');
  });

  test('should reject invalid API key', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'X-API-Key': 'lyd_invalid_key_12345',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('INVALID_API_KEY');
  });

  test('should include correlation ID in errors', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/smart-cities/cities`);

    const body = await response.json();
    expect(body.error.correlationId).toBeDefined();
    expect(body.error.correlationId).toMatch(/^[A-Za-z0-9_-]{21}$/);
  });
});

test.describe('Rate Limiting E2E Tests', () => {
  test('should return rate limit headers', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/smart-cities/cities`, {
      headers: {
        'X-API-Key': TEST_API_KEY,
      },
    });

    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers()['x-ratelimit-reset']).toBeDefined();

    // Verify values
    const limit = parseInt(response.headers()['x-ratelimit-limit']);
    const remaining = parseInt(response.headers()['x-ratelimit-remaining']);
    const reset = parseInt(response.headers()['x-ratelimit-reset']);

    expect(limit).toBeGreaterThan(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(limit);
    expect(reset).toBeGreaterThan(Date.now() / 1000);
  });
});
