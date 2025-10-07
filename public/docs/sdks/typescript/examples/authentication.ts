import { Lydian } from '@lydian/sdk';

// Example 1: API Key Authentication
async function apiKeyAuth() {
  const lydian = new Lydian({
    apiKey: process.env.LYDIAN_API_KEY,
  });

  const cities = await lydian.smartCities.listCities();
  console.log('Cities:', cities);
}

// Example 2: OAuth2 Authentication
async function oauth2Auth() {
  const lydian = new Lydian({
    baseUrl: 'https://api.lydian.ai/v1',
  });

  // Authenticate with OAuth2
  await lydian.authenticateOAuth2({
    clientId: process.env.OAUTH_CLIENT_ID!,
    clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  });

  // Now make authenticated requests
  const cities = await lydian.smartCities.listCities();
  console.log('Cities:', cities);
}

// Example 3: Custom configuration
async function customConfig() {
  const lydian = new Lydian({
    apiKey: process.env.LYDIAN_API_KEY,
    baseUrl: 'https://api.lydian.ai/v1',
    timeout: 60000, // 60 seconds
    retryAttempts: 5,
    retryDelay: 2000, // 2 seconds
  });

  const cities = await lydian.smartCities.listCities();
  console.log('Cities:', cities);
}

// Example 4: Error handling
async function errorHandling() {
  const lydian = new Lydian({
    apiKey: process.env.LYDIAN_API_KEY,
  });

  try {
    const city = await lydian.smartCities.getCity('non-existent-id');
    console.log(city);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);

      // Check if it's a Lydian API error
      if ('statusCode' in error) {
        const apiError = error as any;
        console.error('Status:', apiError.statusCode);
        console.error('Code:', apiError.code);
        console.error('Details:', apiError.details);
      }
    }
  }
}

// Run examples
async function main() {
  console.log('1. API Key Authentication');
  await apiKeyAuth();

  console.log('\n2. OAuth2 Authentication');
  await oauth2Auth();

  console.log('\n3. Custom Configuration');
  await customConfig();

  console.log('\n4. Error Handling');
  await errorHandling();
}

main().catch(console.error);
