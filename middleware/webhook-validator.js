/**
 * 🔐 WEBHOOK SIGNATURE VALIDATION MIDDLEWARE
 * ============================================================================
 * Purpose: Prevent webhook replay attacks and validate authenticity
 * Policy: White-Hat • Zero Mock • Audit-Ready
 *
 * Supported Providers:
 * - Stripe (HMAC SHA256)
 * - GitHub (HMAC SHA256)
 * - Microsoft Azure (HMAC SHA256)
 * - Generic HMAC validation
 *
 * Features:
 * - Cryptographic signature verification
 * - Timestamp validation (prevent replay attacks)
 * - Multiple provider support
 * - Automatic raw body preservation
 * - Detailed error responses
 *
 * Usage:
 *   const { validateWebhook } = require('../middleware/webhook-validator');
 *   module.exports = validateWebhook('stripe')(async (req, res) => { ... });
 * ============================================================================
 */

const crypto = require('crypto');

/**
 * Stripe webhook signature validation
 * Docs: https://stripe.com/docs/webhooks/signatures
 */
function validateStripeSignature(req, secret) {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return { valid: false, error: 'Missing Stripe-Signature header' };
  }

  // Parse signature header
  const elements = signature.split(',');
  const signatureData = {};

  elements.forEach(element => {
    const [key, value] = element.split('=');
    if (key && value) {
      if (key === 'v1') {
        signatureData.signature = value;
      } else if (key === 't') {
        signatureData.timestamp = parseInt(value, 10);
      }
    }
  });

  if (!signatureData.signature || !signatureData.timestamp) {
    return { valid: false, error: 'Invalid Stripe-Signature format' };
  }

  // Check timestamp tolerance (5 minutes)
  const timestampTolerance = 300; // 5 minutes in seconds
  const currentTime = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTime - signatureData.timestamp) > timestampTolerance) {
    return { valid: false, error: 'Webhook timestamp too old (replay attack prevention)' };
  }

  // Compute expected signature
  const signedPayload = `${signatureData.timestamp}.${req.rawBody || ''}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signatureData.signature)
  );

  return {
    valid: isValid,
    error: isValid ? null : 'Signature verification failed',
    timestamp: signatureData.timestamp
  };
}

/**
 * GitHub webhook signature validation
 * Docs: https://docs.github.com/en/webhooks/securing-your-webhooks
 */
function validateGitHubSignature(req, secret) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return { valid: false, error: 'Missing X-Hub-Signature-256 header' };
  }

  // Compute expected signature
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '', 'utf8')
    .digest('hex');

  // Constant-time comparison
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      error: isValid ? null : 'Signature verification failed'
    };
  } catch (error) {
    return { valid: false, error: 'Invalid signature format' };
  }
}

/**
 * Generic HMAC webhook signature validation
 */
function validateGenericHMAC(req, secret, headerName = 'x-webhook-signature', algorithm = 'sha256') {
  const signature = req.headers[headerName.toLowerCase()];

  if (!signature) {
    return { valid: false, error: `Missing ${headerName} header` };
  }

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(req.rawBody || '', 'utf8')
    .digest('hex');

  // Constant-time comparison
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      error: isValid ? null : 'Signature verification failed'
    };
  } catch (error) {
    return { valid: false, error: 'Invalid signature format' };
  }
}

/**
 * Azure Event Grid signature validation
 * Docs: https://learn.microsoft.com/en-us/azure/event-grid/secure-webhook-delivery
 */
function validateAzureSignature(req, secret) {
  // Azure Event Grid validation request (one-time handshake)
  if (req.body && req.body[0] && req.body[0].eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    return {
      valid: true,
      isValidationRequest: true,
      validationCode: req.body[0].data.validationCode
    };
  }

  // Regular webhook signature validation
  return validateGenericHMAC(req, secret, 'aeg-sas-token', 'sha256');
}

/**
 * Middleware to preserve raw body for signature validation
 */
function preserveRawBody(req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}

/**
 * Main webhook validation middleware factory
 *
 * @param {string} provider - Provider name: 'stripe', 'github', 'azure', 'generic'
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function validateWebhook(provider, options = {}) {
  return function(handler) {
    return async (req, res) => {
      try {
        // Get webhook secret from environment
        const secretKey = options.secretKey || {
          stripe: process.env.STRIPE_WEBHOOK_SECRET,
          github: process.env.GITHUB_WEBHOOK_SECRET,
          azure: process.env.AZURE_WEBHOOK_SECRET,
          generic: process.env.WEBHOOK_SECRET
        }[provider];

        if (!secretKey) {
          console.error(`[WebhookValidator] ${provider} webhook secret not configured`);

          if (options.allowUnconfigured) {
            // Allow webhook to proceed without validation (dev/testing only)
            console.warn(`[WebhookValidator] WARNING: ${provider} webhook validation skipped (secret not configured)`);
            return handler(req, res);
          }

          return res.status(503).json({
            success: false,
            error: 'Webhook validation not configured',
            code: 'WEBHOOK_SECRET_NOT_CONFIGURED'
          });
        }

        // Ensure raw body is available
        if (!req.rawBody && req.body) {
          req.rawBody = JSON.stringify(req.body);
        }

        // Validate signature based on provider
        let result;

        switch (provider.toLowerCase()) {
          case 'stripe':
            result = validateStripeSignature(req, secretKey);
            break;

          case 'github':
            result = validateGitHubSignature(req, secretKey);
            break;

          case 'azure':
            result = validateAzureSignature(req, secretKey);

            // Handle Azure validation request
            if (result.isValidationRequest) {
              return res.status(200).json({
                validationResponse: result.validationCode
              });
            }
            break;

          case 'generic':
            result = validateGenericHMAC(
              req,
              secretKey,
              options.headerName || 'x-webhook-signature',
              options.algorithm || 'sha256'
            );
            break;

          default:
            return res.status(400).json({
              success: false,
              error: `Unsupported webhook provider: ${provider}`,
              code: 'UNSUPPORTED_PROVIDER'
            });
        }

        if (!result.valid) {
          console.warn(`[WebhookValidator] ${provider} webhook validation failed:`, result.error);

          // Audit log for security monitoring
          console.error(`[Security] Webhook validation failed from IP ${req.headers['x-forwarded-for'] || req.ip}`);

          return res.status(401).json({
            success: false,
            error: 'Webhook signature validation failed',
            code: 'INVALID_WEBHOOK_SIGNATURE',
            details: process.env.NODE_ENV === 'production' ? undefined : result.error
          });
        }

        // Validation successful - attach metadata
        req.webhookValidated = true;
        req.webhookProvider = provider;
        req.webhookTimestamp = result.timestamp;

        // Call the actual handler
        return handler(req, res);

      } catch (error) {
        console.error(`[WebhookValidator] Error validating ${provider} webhook:`, error);

        return res.status(500).json({
          success: false,
          error: 'Webhook validation error',
          code: 'WEBHOOK_VALIDATION_ERROR'
        });
      }
    };
  };
}

/**
 * Generate webhook signature (for testing)
 */
function generateWebhookSignature(payload, secret, provider = 'stripe') {
  const timestamp = Math.floor(Date.now() / 1000);

  switch (provider.toLowerCase()) {
    case 'stripe': {
      const signedPayload = `${timestamp}.${payload}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      return `t=${timestamp},v1=${signature}`;
    }

    case 'github': {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      return `sha256=${signature}`;
    }

    case 'generic': {
      return crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

module.exports = {
  validateWebhook,
  preserveRawBody,
  generateWebhookSignature,
  // Export individual validators for advanced use
  validateStripeSignature,
  validateGitHubSignature,
  validateAzureSignature,
  validateGenericHMAC
};
