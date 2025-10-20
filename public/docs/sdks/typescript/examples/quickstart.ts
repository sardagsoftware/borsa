import { Lydian } from '@lydian/sdk';

// Initialize client with API key
const lydian = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
});

async function main() {
  try {
    // Create a new city
    const city = await lydian.smartCities.createCity({
      name: 'San Francisco',
      country: 'USA',
      population: 873965,
      timezone: 'America/Los_Angeles',
    });

    console.log('City created:', city);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
