/**
 * Smart Cities SDK - Idempotency Example
 *
 * This example shows how to use idempotency keys to prevent duplicate operations
 */

import { createClient } from '@lydian/smart-cities-sdk';
import { randomUUID } from 'crypto';

const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Use idempotency key to prevent duplicate city creation
const idempotencyKey = randomUUID();

// First call creates the city
const city1 = await client.createCity({
  name: 'Ankara Smart City',
  coordinates: { latitude: 39.9334, longitude: 32.8597 },
  population: 5_639_076,
  timezone: 'Europe/Istanbul'
}, idempotencyKey);

// Second call with same idempotency key returns the existing city
const city2 = await client.createCity({
  name: 'Ankara Smart City',
  coordinates: { latitude: 39.9334, longitude: 32.8597 },
  population: 5_639_076,
  timezone: 'Europe/Istanbul'
}, idempotencyKey);

console.log('Same city ID:', city1.cityId === city2.cityId); // true
