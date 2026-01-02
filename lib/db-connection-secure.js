/**
 * SECURE DATABASE CONNECTION
 * Replaces test-connection-formats.js with secure implementation
 * White-Hat Security Compliant
 */

const { Client } = require('pg');

/**
 * Get database connection string from environment variables
 * NEVER hardcode credentials!
 */
function getDatabaseConfig() {
  // Support DATABASE_URL (connection string) or individual parameters
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === 'production'
          ? {
              rejectUnauthorized: false, // Supabase/Vercel use self-signed certs
            }
          : false,
      connectionTimeoutMillis: 5000,
    };
  }

  // Individual parameters
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 6543,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeoutMillis: 5000,
  };

  // Validate required credentials
  if (!config.password) {
    throw new Error('DB_PASSWORD or DATABASE_URL environment variable is required');
  }

  if (!config.host) {
    throw new Error('DB_HOST or DATABASE_URL environment variable is required');
  }

  return config;
}

/**
 * Create secure database client
 */
async function createSecureClient() {
  const config = getDatabaseConfig();
  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ Database connected securely');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  let client;

  try {
    client = await createSecureClient();
    const result = await client.query('SELECT version();');
    console.log('📌 PostgreSQL version:', result.rows[0].version.substring(0, 50));
    return true;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

module.exports = {
  getDatabaseConfig,
  createSecureClient,
  testConnection,
};

/**
 * USAGE:
 *
 * // Set environment variables:
 * export DB_HOST=your-host.supabase.com
 * export DB_PASSWORD=your-secure-password
 * export DB_PORT=6543
 *
 * // In your code:
 * const { createSecureClient } = require('./lib/db-connection-secure');
 * const client = await createSecureClient();
 */
