/**
 * Prisma Client for AI Governance (ACE)
 *
 * Provides a singleton Prisma client instance for all governance APIs.
 * Handles connection pooling, error handling, and graceful shutdown.
 *
 * @module api/governance/prisma-client
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Singleton Prisma Client instance
 * @type {PrismaClient|null}
 */
let prismaInstance = null;

/**
 * Database configuration options
 */
const prismaOptions = {
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],

  errorFormat: 'pretty',
};

/**
 * Get or create Prisma Client instance
 *
 * @returns {PrismaClient} Prisma client instance
 */
function getPrismaClient() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient(prismaOptions);

    // Connect on first use
    prismaInstance.$connect()
      .then(() => {
        console.log('✅ Prisma connected to database');
      })
      .catch((error) => {
        console.error('❌ Prisma connection error:', error.message);
        // Don't throw - allow fallback to mock data if needed
      });
  }

  return prismaInstance;
}

/**
 * Close Prisma connection gracefully
 * Should be called on server shutdown
 */
async function disconnectPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    console.log('✅ Prisma disconnected');
  }
}

/**
 * Check if database is available
 *
 * @returns {Promise<boolean>} True if database is available
 */
async function isDatabaseAvailable() {
  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('⚠️ Database not available:', error.message);
    return false;
  }
}

/**
 * Execute a database query safely with error handling
 *
 * @param {Function} queryFn - Async function that performs the query
 * @param {Function} fallbackFn - Optional fallback function if database is unavailable
 * @returns {Promise<any>} Query result or fallback result
 */
async function safeQuery(queryFn, fallbackFn = null) {
  try {
    const prisma = getPrismaClient();
    return await queryFn(prisma);
  } catch (error) {
    console.error('Database query error:', error.message);

    // If fallback provided, use it (for backward compatibility with mock data)
    if (fallbackFn) {
      console.warn('⚠️ Using fallback data (mock mode)');
      return fallbackFn();
    }

    throw error;
  }
}

/**
 * Health check for database connection
 *
 * @returns {Promise<{status: string, message: string}>} Health status
 */
async function healthCheck() {
  try {
    const isAvailable = await isDatabaseAvailable();

    if (isAvailable) {
      return {
        status: 'healthy',
        message: 'Database connection is active',
      };
    } else {
      return {
        status: 'degraded',
        message: 'Database connection is unavailable (using mock data)',
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database error: ${error.message}`,
    };
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  process.exit(0);
});

module.exports = {
  getPrismaClient,
  disconnectPrisma,
  isDatabaseAvailable,
  safeQuery,
  healthCheck,
};
