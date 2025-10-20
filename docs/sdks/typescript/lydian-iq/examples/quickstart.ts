/**
 * LyDian IQ SDK - Quickstart Example
 *
 * This example shows how to:
 * 1. Create a client with API key authentication
 * 2. Ingest real-time signals
 * 3. Query insights from the knowledge graph
 */

import { createClient } from '@lydian/lydian-iq-sdk';

// Create client with API key authentication
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Ingest a real-time signal
const signal = await client.ingestSignal({
  signalType: 'user-event',
  source: 'web-app',
  timestamp: new Date().toISOString(),
  payload: {
    eventType: 'page-view',
    userId: 'user_123',
    page: '/dashboard'
  }
});

console.log('Signal ingested:', signal.signalId);

// Query AI-derived insights
const insights = await client.getInsights({ limit: 5 });
console.log(`Found ${insights.data.length} insights`);
