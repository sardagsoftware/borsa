#!/usr/bin/env node
/**
 * 🛡️ HEADER-GUARD - HTTP Header Security Tool
 * ============================================================================
 * Purpose: Remove/replace headers that leak provider/technology information
 * Policy: White-Hat • Zero Mock • Audit-Ready
 *
 * Usage:
 *   const { sanitizeHeaders } = require('./header-guard');
 *   const cleaned = sanitizeHeaders(req.headers);
 *
 * Removes:
 * - X-Powered-By
 * - Server
 * - X-AspNet-Version
 * - X-AspNetMvc-Version
 * - X-Generator
 * - Via (with provider names)
 * - X-OpenAI-*, X-Anthropic-*, etc.
 * ============================================================================
 */

const FORBIDDEN_HEADERS = [
  'x-powered-by',
  'server',
  'x-aspnet-version',
  'x-aspnetmvc-version',
  'x-generator',
  'x-runtime',
  'x-version'
];

const PROVIDER_HEADER_PATTERNS = [
  /^x-openai-/i,
  /^x-anthropic-/i,
  /^x-google-ai-/i,
  /^x-azure-openai-/i,
  /^x-cohere-/i,
  /^openai-/i,
  /^anthropic-/i
];

const FORBIDDEN_VALUES = [
  /openai/i,
  /anthropic/i,
  /AX9F7E2B/i,
  /gpt-?\d/i,
  /gemini/i,
  /azure.*openai/i,
  /cohere/i
];

/**
 * Sanitize HTTP headers
 */
function sanitizeHeaders(headers) {
  const cleaned = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    // Remove forbidden headers
    if (FORBIDDEN_HEADERS.includes(lowerKey)) {
      continue;
    }

    // Remove provider-specific headers
    if (PROVIDER_HEADER_PATTERNS.some(pattern => pattern.test(key))) {
      continue;
    }

    // Check value for forbidden patterns
    if (typeof value === 'string') {
      const hasForbiddenValue = FORBIDDEN_VALUES.some(pattern => pattern.test(value));
      if (hasForbiddenValue) {
        // Mask the value
        cleaned[key] = '[REDACTED]';
        continue;
      }
    }

    // Keep the header
    cleaned[key] = value;
  }

  return cleaned;
}

/**
 * Express middleware for header sanitization
 */
function headerGuardMiddleware() {
  return (req, res, next) => {
    // Sanitize incoming request headers
    req.headers = sanitizeHeaders(req.headers);

    // Intercept outgoing response headers
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function(name, value) {
      const lowerName = name.toLowerCase();

      // Block forbidden headers
      if (FORBIDDEN_HEADERS.includes(lowerName)) {
        return res;
      }

      // Block provider headers
      if (PROVIDER_HEADER_PATTERNS.some(pattern => pattern.test(name))) {
        return res;
      }

      // Check value
      if (typeof value === 'string') {
        const hasForbiddenValue = FORBIDDEN_VALUES.some(pattern => pattern.test(value));
        if (hasForbiddenValue) {
          return res; // Don't set the header
        }
      }

      return originalSetHeader(name, value);
    };

    next();
  };
}

/**
 * Vercel serverless function wrapper
 */
function withHeaderGuard(handler) {
  return async (req, res) => {
    // Sanitize request headers
    req.headers = sanitizeHeaders(req.headers);

    // Wrap response
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function(name, value) {
      const lowerName = name.toLowerCase();

      if (FORBIDDEN_HEADERS.includes(lowerName)) {
        return res;
      }

      if (PROVIDER_HEADER_PATTERNS.some(pattern => pattern.test(name))) {
        return res;
      }

      if (typeof value === 'string' && FORBIDDEN_VALUES.some(p => p.test(value))) {
        return res;
      }

      return originalSetHeader(name, value);
    };

    return handler(req, res);
  };
}

/**
 * Test header sanitization
 */
function testHeaderGuard() {
  console.log('🛡️ HEADER-GUARD TEST\n');

  const testHeaders = {
    'content-type': 'application/json',
    'x-powered-by': 'Express',
    'server': 'nginx',
    'x-openai-version': '2024-01-01',
    'authorization': 'Bearer sk-...',
    'user-agent': 'OpenAI-Client/1.0',
    'via': 'Anthropic Gateway',
    'x-custom': 'safe-value'
  };

  console.log('Original headers:');
  console.log(testHeaders);

  const cleaned = sanitizeHeaders(testHeaders);

  console.log('\nCleaned headers:');
  console.log(cleaned);

  console.log('\nRemoved headers:');
  Object.keys(testHeaders).forEach(key => {
    if (!cleaned[key] && testHeaders[key] !== cleaned[key]) {
      console.log(`  - ${key}: ${testHeaders[key]}`);
    }
  });

  console.log('\n✅ Header guard test complete');
}

// Run test if executed directly
if (require.main === module) {
  testHeaderGuard();
}

module.exports = {
  sanitizeHeaders,
  headerGuardMiddleware,
  withHeaderGuard,
  FORBIDDEN_HEADERS,
  PROVIDER_HEADER_PATTERNS
};
