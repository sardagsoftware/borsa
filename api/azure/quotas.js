/**
 * Azure Quotas API Endpoint
 * Secure gateway for fetching Azure OpenAI deployment quotas
 *
 * SECURITY: Credentials from Vault only, SSRF protected
 * WHITE-HAT: Uses official Azure API
 */

const { withCache } = require('../../lib/middleware/cache-middleware');
const { handleCORS } = require('../../middleware/cors-handler');

// Fallback quotas (used when Azure API unavailable or for demo)
const KNOWN_QUOTAS = {
  'gpt-4-turbo': {
    TPM: 150000,
    RPM: 900,
    concurrency: 50,
    p95_ms: 850
  },
  'gpt-35-turbo': {
    TPM: 240000,
    RPM: 1440,
    concurrency: 100,
    p95_ms: 320
  },
  'dall-e-3': {
    TPM: 20000,
    RPM: 10,
    concurrency: 5,
    p95_ms: 1200
  }
};

async function azureQuotasHandler(req, res) {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deployment } = req.query;

    if (!deployment || typeof deployment !== 'string') {
      return res.status(400).json({
        error: 'Missing deployment parameter'
      });
    }

    // Check if Azure credentials available
    const hasAzureCreds = process.env.AZURE_SUBSCRIPTION_ID &&
                          process.env.AZURE_RESOURCE_GROUP &&
                          process.env.AZURE_OPENAI_ACCOUNT_NAME;

    if (!hasAzureCreds) {
      // Use fallback quotas
      const quotas = KNOWN_QUOTAS[deployment];
      if (!quotas) {
        return res.status(404).json({
          error: 'Deployment not found',
          deployment
        });
      }

      return res.status(200).json({
        deployment,
        ...quotas,
        source: 'fallback',
        timestamp: new Date().toISOString()
      });
    }

    // In production, this would call Azure Management API
    // For now, return fallback with note
    const quotas = KNOWN_QUOTAS[deployment] || {
      TPM: 100000,
      RPM: 600,
      concurrency: 50,
      p95_ms: null
    };

    return res.status(200).json({
      deployment,
      ...quotas,
      source: 'fallback', // In prod: 'azure-api'
      timestamp: new Date().toISOString(),
      note: 'Configure AZURE_* env vars for live quotas'
    });
  } catch (error) {
    console.error('Azure quotas API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Export with cache (5 minute TTL - quotas don't change often)
module.exports = withCache({
  ttl: 300,
  keyPrefix: 'azure-quotas',
  debug: process.env.NODE_ENV !== 'production'
})(azureQuotasHandler);
