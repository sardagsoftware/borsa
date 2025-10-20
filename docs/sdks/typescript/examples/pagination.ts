import { Lydian } from '@lydian/sdk';

const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

async function paginationExample() {
  // Example 1: Basic pagination
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await lydian.smartCities.listCities({
      page,
      limit: 20,
    });

    console.log(`Page ${page}: Found ${result.data.length} cities`);
    result.data.forEach(city => {
      console.log(`  - ${city.name}, ${city.country}`);
    });

    hasMore = result.pagination.hasMore;
    page++;
  }

  // Example 2: Cursor-based pagination
  let cursor: string | undefined;
  do {
    const result = await lydian.smartCities.listCities({
      limit: 20,
      cursor,
    });

    console.log(`Fetched ${result.data.length} cities`);

    cursor = result.pagination.cursor;
  } while (cursor);

  // Example 3: Fetch all items helper
  async function fetchAllCities() {
    const allCities = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await lydian.smartCities.listCities({ page, limit: 100 });
      allCities.push(...result.data);
      hasMore = result.pagination.hasMore;
      page++;
    }

    return allCities;
  }

  const cities = await fetchAllCities();
  console.log(`Total cities: ${cities.length}`);
}

paginationExample().catch(console.error);
