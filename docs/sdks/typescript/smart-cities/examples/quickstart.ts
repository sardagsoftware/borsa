/**
 * Smart Cities SDK - Quickstart Example
 *
 * This example shows how to:
 * 1. Create a client with API key authentication
 * 2. Create a new city
 * 3. Get real-time city metrics
 */

import { createClient } from '@lydian/smart-cities-sdk';

// Create client with API key authentication
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Create a new smart city
const city = await client.createCity({
  name: 'İstanbul Smart City',
  coordinates: { latitude: 41.0082, longitude: 28.9784 },
  population: 15_840_900,
  timezone: 'Europe/Istanbul'
});

// Get real-time city metrics
const metrics = await client.getCityMetrics(city.cityId);
console.log('Traffic congestion:', metrics.traffic.congestionLevel);
console.log('Energy consumption:', metrics.energy.totalConsumption, 'kWh');
console.log('Air quality index:', metrics.air.aqi);
