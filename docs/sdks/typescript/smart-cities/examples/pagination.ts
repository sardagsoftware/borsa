/**
 * Smart Cities SDK - Pagination Example
 *
 * This example shows how to paginate through large result sets
 */

import { createClient } from '@lydian/smart-cities-sdk';

const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Paginate through all cities
let hasMore = true;
let cursor: string | undefined;
let allCities = [];

while (hasMore) {
  const response = await client.listCities({ cursor, limit: 50 });
  allCities.push(...response.data);
  cursor = response.nextCursor;
  hasMore = response.hasMore;
}

console.log(`Total cities: ${allCities.length}`);
