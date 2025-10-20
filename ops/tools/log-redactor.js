#!/usr/bin/env node
/**
 * 🔒 LOG-REDACTOR - Sensitive Data Masking Tool
 * ============================================================================
 * Purpose: Redact PII/PHI and provider names from logs
 * Policy: White-Hat • Zero Mock • Audit-Ready • GDPR/HIPAA Compliant
 *
 * Usage:
 *   const { redact, redactLog } = require('./log-redactor');
 *   console.log(redact(message));
 *
 * Redacts:
 * - API keys and secrets
 * - Email addresses
 * - Phone numbers
 * - Credit card numbers
 * - IP addresses (optional)
 * - AI provider/model names
 * - Personal identifiers
 * ============================================================================
 */

// Redaction patterns
const PATTERNS = {
  // API Keys & Secrets
  openai_key: {
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    replacement: 'sk-****REDACTED****',
    severity: 'critical'
  },
  anthropic_key: {
    pattern: /sk-ant-[a-zA-Z0-9-]{95}/g,
    replacement: 'sk-ant-****REDACTED****',
    severity: 'critical'
  },
  generic_api_key: {
    pattern: /[a-zA-Z0-9_-]{32,}/g,
    replacement: (match) => {
      if (match.length < 32) return match;
      return `${match.substring(0, 4)}****${match.substring(match.length - 3)}`;
    },
    severity: 'high'
  },

  // PII
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
    severity: 'high'
  },
  phone: {
    pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: '[PHONE_REDACTED]',
    severity: 'high'
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
    severity: 'critical'
  },
  credit_card: {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CC_REDACTED]',
    severity: 'critical'
  },

  // IP Addresses (optional - may want to keep for debugging)
  ipv4: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
    severity: 'medium',
    enabled: false // Disabled by default
  },

  // AI Provider Names
  provider_openai: {
    pattern: /\bOpenAI\b/gi,
    replacement: '[PROVIDER_A]',
    severity: 'high'
  },
  provider_anthropic: {
    pattern: /\bAnthropic\b/gi,
    replacement: '[PROVIDER_B]',
    severity: 'high'
  },
  provider_google: {
    pattern: /\bGoogle\s+(AI|Gemini)\b/gi,
    replacement: '[PROVIDER_C]',
    severity: 'high'
  },

  // Model Names
  model_gpt: {
    pattern: /\bGPT-?[0-9o]+(-turbo|-vision|-instruct)?\b/gi,
    replacement: '[MODEL_A]',
    severity: 'high'
  },
  model_claude: {
    pattern: /\bClaude(-\d+)?(-instant|-opus|-sonnet)?\b/gi,
    replacement: '[MODEL_B]',
    severity: 'high'
  },
  model_gemini: {
    pattern: /\bGemini(-pro|-ultra|-nano)?\b/gi,
    replacement: '[MODEL_C]',
    severity: 'high'
  },

  // Endpoints
  endpoint_openai: {
    pattern: /api\.openai\.com/gi,
    replacement: '[ENDPOINT_A]',
    severity: 'high'
  },
  endpoint_anthropic: {
    pattern: /api\.anthropic\.com/gi,
    replacement: '[ENDPOINT_B]',
    severity: 'high'
  },
  endpoint_google: {
    pattern: /generativelanguage\.googleapis\.com/gi,
    replacement: '[ENDPOINT_C]',
    severity: 'high'
  }
};

/**
 * Redact sensitive information from text
 */
function redact(text, options = {}) {
  if (typeof text !== 'string') {
    return text;
  }

  let redacted = text;
  const redactions = [];

  Object.entries(PATTERNS).forEach(([name, config]) => {
    // Skip if disabled
    if (config.enabled === false && !options.includeDisabled) {
      return;
    }

    // Skip if below severity threshold
    if (options.minSeverity) {
      const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
      if (severityLevels[config.severity] < severityLevels[options.minSeverity]) {
        return;
      }
    }

    const matches = text.match(config.pattern);
    if (matches) {
      redactions.push({
        pattern: name,
        count: matches.length,
        severity: config.severity
      });

      if (typeof config.replacement === 'function') {
        redacted = redacted.replace(config.pattern, config.replacement);
      } else {
        redacted = redacted.replace(config.pattern, config.replacement);
      }
    }
  });

  return {
    redacted,
    redactions,
    hadSensitiveData: redactions.length > 0
  };
}

/**
 * Redact and return only the redacted string
 */
function redactString(text, options) {
  const result = redact(text, options);
  return result.redacted;
}

/**
 * Create a logging wrapper that auto-redacts
 */
function createRedactedLogger(originalLogger = console) {
  return {
    log: (...args) => {
      const redacted = args.map(arg =>
        typeof arg === 'string' ? redactString(arg) : arg
      );
      originalLogger.log(...redacted);
    },
    info: (...args) => {
      const redacted = args.map(arg =>
        typeof arg === 'string' ? redactString(arg) : arg
      );
      originalLogger.info(...redacted);
    },
    warn: (...args) => {
      const redacted = args.map(arg =>
        typeof arg === 'string' ? redactString(arg) : arg
      );
      originalLogger.warn(...redacted);
    },
    error: (...args) => {
      const redacted = args.map(arg =>
        typeof arg === 'string' ? redactString(arg) : arg
      );
      originalLogger.error(...redacted);
    },
    debug: (...args) => {
      const redacted = args.map(arg =>
        typeof arg === 'string' ? redactString(arg) : arg
      );
      if (originalLogger.debug) {
        originalLogger.debug(...redacted);
      } else {
        originalLogger.log(...redacted);
      }
    }
  };
}

/**
 * Test log redaction
 */
function test() {
  console.log('🔒 LOG-REDACTOR TEST\n');

  const testCases = [
    'API key: sk-proj1234567890abcdefghijklmnopqrstuvwxyz123456',
    'Email: user@example.com',
    'Phone: +1 (555) 123-4567',
    'Using OpenAI GPT-4-turbo model',
    'Calling api.anthropic.com with Claude-3-sonnet',
    'IP: 192.168.1.100',
    'Credit Card: 4532-1234-5678-9010'
  ];

  testCases.forEach(test => {
    const result = redact(test);
    console.log('Original:', test);
    console.log('Redacted:', result.redacted);
    console.log('Redactions:', result.redactions);
    console.log('');
  });

  console.log('✅ Log redactor test complete');
}

// Run test if executed directly
if (require.main === module) {
  test();
}

module.exports = {
  redact,
  redactString,
  createRedactedLogger,
  PATTERNS
};
