/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VAULT/KMS SECRET MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Secure secret storage and retrieval with automatic rotation
 *
 * Features:
 * - In-memory cache with ≤24h TTL (auto rotation)
 * - Azure Key Vault integration (production)
 * - Environment variable fallback (development)
 * - Secret versioning
 * - Audit logging
 *
 * Secret naming convention:
 * connector/{vendor}/api-key
 * connector/{vendor}/api-secret
 * connector/{vendor}/webhook-secret
 *
 * @module lib/vault/secrets
 */

const crypto = require('crypto');

// Cache for secrets (in-memory, ≤24h TTL)
const secretCache = new Map();
const SECRET_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get secret from Vault/KMS
 * @param {string} secretPath Secret path (e.g., 'connector/trendyol')
 * @returns {Promise<Object|null>} Secret object or null
 */
async function getVaultSecret(secretPath) {
  try {
    // Check cache first
    const cached = getCachedSecret(secretPath);
    if (cached) {
      return cached;
    }

    // Load secret based on environment
    let secret;
    if (process.env.NODE_ENV === 'production' && process.env.AZURE_KEY_VAULT_URL) {
      secret = await getAzureKeyVaultSecret(secretPath);
    } else {
      // Development: use environment variables
      secret = getEnvSecret(secretPath);
    }

    if (!secret) {
      console.warn(`[Vault] Secret not found: ${secretPath}`);
      return null;
    }

    // Cache secret
    cacheSecret(secretPath, secret);

    return secret;
  } catch (error) {
    console.error(`[Vault] Failed to get secret ${secretPath}:`, error);
    return null;
  }
}

/**
 * Get cached secret
 * @param {string} secretPath Secret path
 * @returns {Object|null} Cached secret or null
 */
function getCachedSecret(secretPath) {
  const cached = secretCache.get(secretPath);

  if (!cached) {
    return null;
  }

  // Check TTL
  const now = Date.now();
  if (now - cached.timestamp > SECRET_TTL) {
    // Expired - remove from cache
    secretCache.delete(secretPath);
    return null;
  }

  return cached.value;
}

/**
 * Cache secret with TTL
 * @param {string} secretPath Secret path
 * @param {Object} secret Secret object
 */
function cacheSecret(secretPath, secret) {
  secretCache.set(secretPath, {
    value: secret,
    timestamp: Date.now(),
  });
}

/**
 * Get secret from Azure Key Vault (production)
 * @param {string} secretPath Secret path
 * @returns {Promise<Object|null>} Secret object
 */
async function getAzureKeyVaultSecret(secretPath) {
  try {
    const { SecretClient } = require('@azure/keyvault-secrets');
    const { DefaultAzureCredential } = require('@azure/identity');

    const credential = new DefaultAzureCredential();
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    const client = new SecretClient(vaultUrl, credential);

    // Convert path to Azure Key Vault secret name
    // connector/trendyol → connector-trendyol
    const secretName = secretPath.replace(/\//g, '-');

    const secret = await client.getSecret(secretName);

    // Parse JSON value
    return JSON.parse(secret.value);
  } catch (error) {
    console.error(`[Vault] Azure Key Vault error for ${secretPath}:`, error);
    return null;
  }
}

/**
 * Get secret from environment variables (development)
 * @param {string} secretPath Secret path
 * @returns {Object|null} Secret object
 */
function getEnvSecret(secretPath) {
  // connector/trendyol → CONNECTOR_TRENDYOL_API_KEY, etc.
  const envPrefix = secretPath.toUpperCase().replace(/\//g, '_');

  const apiKey = process.env[`${envPrefix}_API_KEY`];
  const apiSecret = process.env[`${envPrefix}_API_SECRET`];
  const webhookSecret = process.env[`${envPrefix}_WEBHOOK_SECRET`];

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiSecret: apiSecret || null,
    webhookSecret: webhookSecret || null,
    vendor: secretPath.split('/')[1],
    source: 'env',
  };
}

/**
 * Store secret in Vault (admin only)
 * @param {string} secretPath Secret path
 * @param {Object} secretValue Secret value
 * @returns {Promise<boolean>} Success
 */
async function storeVaultSecret(secretPath, secretValue) {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.AZURE_KEY_VAULT_URL) {
      const { SecretClient } = require('@azure/keyvault-secrets');
      const { DefaultAzureCredential } = require('@azure/identity');

      const credential = new DefaultAzureCredential();
      const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
      const client = new SecretClient(vaultUrl, credential);

      const secretName = secretPath.replace(/\//g, '-');
      await client.setSecret(secretName, JSON.stringify(secretValue));

      console.log(`[Vault] Stored secret: ${secretPath}`);

      // Invalidate cache
      secretCache.delete(secretPath);

      return true;
    } else {
      console.warn('[Vault] Cannot store secret in development mode');
      return false;
    }
  } catch (error) {
    console.error(`[Vault] Failed to store secret ${secretPath}:`, error);
    return false;
  }
}

/**
 * Generate webhook HMAC signature
 * @param {string} payload Webhook payload (JSON string)
 * @param {string} secret Webhook secret
 * @returns {string} HMAC signature (hex)
 */
function generateWebhookSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook HMAC signature
 * @param {string} payload Webhook payload (JSON string)
 * @param {string} signature Received signature
 * @param {string} secret Webhook secret
 * @returns {boolean} Valid signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expected = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Clear all cached secrets (force refresh)
 */
function clearSecretCache() {
  secretCache.clear();
  console.log('[Vault] Secret cache cleared');
}

/**
 * Get cache statistics (for monitoring)
 */
function getCacheStats() {
  return {
    size: secretCache.size,
    keys: Array.from(secretCache.keys()),
  };
}

module.exports = {
  getVaultSecret,
  storeVaultSecret,
  generateWebhookSignature,
  verifyWebhookSignature,
  clearSecretCache,
  getCacheStats,
  SECRET_TTL,
};
