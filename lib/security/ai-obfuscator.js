/**
 * AI Model Name Obfuscator
 * White-Hat Security Layer for AI Provider Anonymization
 *
 * Purpose: Encrypt and obfuscate AI model names to prevent
 * reverse engineering and competitive intelligence gathering
 */

const crypto = require('crypto');

// Encryption Configuration
const OBFUSCATION_KEY = process.env.AI_OBFUSCATION_KEY || 'LYDIAN_SECURITY_LAYER_2025';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * AI Model Mapping - Internal Only
 * These mappings are never exposed to client-side code
 */
const AI_MODEL_REGISTRY = {
  // Strategic Model Aliases
  'STRATEGIC_REASONING_ENGINE': 'claude-3-5-sonnet-20241022',
  'ADVANCED_LANGUAGE_PROCESSOR': 'claude-3-opus-20240229',
  'RAPID_RESPONSE_UNIT': 'claude-3-haiku-20240307',
  'MULTIMODAL_VISION_CORE': 'claude-3-5-sonnet-20241022',
  'LEGACY_REASONING_V3': 'claude-3-sonnet-20240229',

  // Alternative Provider Aliases
  'CONVERSATIONAL_AI_ALPHA': 'gpt-4-turbo-preview',
  'CONVERSATIONAL_AI_BETA': 'gpt-4',
  'CONVERSATIONAL_AI_GAMMA': 'gpt-3.5-turbo',

  // Research & Search Aliases
  'KNOWLEDGE_SEARCH_ENGINE': 'perplexity-sonar-medium-online',
  'RESEARCH_ASSISTANT_PRO': 'perplexity-codellama-70b-instruct',

  // Multimodal Aliases
  'VISUAL_INTELLIGENCE_UNIT': 'gemini-pro-vision',
  'GENERAL_INTELLIGENCE_CORE': 'gemini-pro'
};

/**
 * Provider Mapping - Obfuscated
 */
const PROVIDER_ALIASES = {
  'PRIMARY_AI_PROVIDER': 'anthropic',
  'SECONDARY_AI_PROVIDER': 'openai',
  'TERTIARY_AI_PROVIDER': 'perplexity',
  'MULTIMODAL_PROVIDER': 'google'
};

/**
 * API Endpoint Obfuscation
 */
const ENDPOINT_REGISTRY = {
  'PRIMARY_ENDPOINT': 'https://api.anthropic.com/v1/messages',
  'SECONDARY_ENDPOINT': 'https://api.openai.com/v1/chat/completions',
  'TERTIARY_ENDPOINT': 'https://api.perplexity.ai/chat/completions',
  'MULTIMODAL_ENDPOINT': 'https://generativelanguage.googleapis.com/v1/models'
};

/**
 * Encrypt a string value
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(OBFUSCATION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt a value
 */
function decrypt(encrypted, ivHex, authTagHex) {
  const key = crypto.scryptSync(OBFUSCATION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get Real Model Name from Alias
 */
function resolveModel(alias) {
  if (!alias) {
    throw new Error('[AI-OBFUSCATOR] Model alias is required');
  }

  const realModel = AI_MODEL_REGISTRY[alias];

  if (!realModel) {
    console.warn(`[AI-OBFUSCATOR] Unknown model alias: ${alias}, using fallback`);
    return AI_MODEL_REGISTRY['RAPID_RESPONSE_UNIT']; // Default fallback
  }

  return realModel;
}

/**
 * Get Real Provider from Alias
 */
function resolveProvider(alias) {
  if (!alias) {
    throw new Error('[AI-OBFUSCATOR] Provider alias is required');
  }

  return PROVIDER_ALIASES[alias] || PROVIDER_ALIASES['PRIMARY_AI_PROVIDER'];
}

/**
 * Get Real Endpoint from Alias
 */
function resolveEndpoint(alias) {
  if (!alias) {
    throw new Error('[AI-OBFUSCATOR] Endpoint alias is required');
  }

  return ENDPOINT_REGISTRY[alias] || ENDPOINT_REGISTRY['PRIMARY_ENDPOINT'];
}

/**
 * Get API Key from Environment (Never Hardcoded)
 */
function getAPIKey(provider) {
  const keyMap = {
    'PRIMARY_AI_PROVIDER': process.env.PRIMARY_AI_KEY,
    'SECONDARY_AI_PROVIDER': process.env.SECONDARY_AI_KEY,
    'TERTIARY_AI_PROVIDER': process.env.TERTIARY_AI_KEY,
    'MULTIMODAL_PROVIDER': process.env.MULTIMODAL_AI_KEY
  };

  const key = keyMap[provider];

  if (!key) {
    throw new Error(`[AI-OBFUSCATOR] API key not found for provider: ${provider}`);
  }

  return key;
}

/**
 * Obfuscate Model Name in Response Headers
 */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };

  // Remove identifying headers
  const sensitiveHeaders = [
    'x-anthropic-version',
    'anthropic-version',
    'openai-version',
    'x-request-id',
    'cf-ray'
  ];

  sensitiveHeaders.forEach(header => {
    delete sanitized[header];
    delete sanitized[header.toLowerCase()];
  });

  return sanitized;
}

/**
 * Create Request Configuration with Obfuscated Values
 */
function createSecureConfig(modelAlias, providerAlias) {
  return {
    model: resolveModel(modelAlias),
    provider: resolveProvider(providerAlias),
    endpoint: resolveEndpoint(providerAlias === 'PRIMARY_AI_PROVIDER' ? 'PRIMARY_ENDPOINT' : 'SECONDARY_ENDPOINT'),
    apiKey: getAPIKey(providerAlias),
    headers: {
      'User-Agent': 'Lydian-Intelligence-Platform/2.0',
      'X-Request-Source': 'Lydian-Core'
    }
  };
}

/**
 * Generate Dynamic Alias (for runtime obfuscation)
 */
function generateDynamicAlias(modelName) {
  const hash = crypto.createHash('sha256').update(modelName).digest('hex').substring(0, 16);
  return `MODEL_${hash.toUpperCase()}`;
}

/**
 * Validate that no AI names are exposed in object
 */
function validateNoLeaks(obj) {
  const sensitiveTerms = ['claude', 'anthropic', 'openai', 'gpt-', 'gemini', 'perplexity'];
  const objString = JSON.stringify(obj).toLowerCase();

  for (const term of sensitiveTerms) {
    if (objString.includes(term)) {
      console.warn(`[AI-OBFUSCATOR] Potential leak detected: ${term}`);
      return false;
    }
  }

  return true;
}

/**
 * Strip AI Provider Info from Error Messages
 */
function sanitizeError(error) {
  if (!error || !error.message) return error;

  let sanitized = error.message;

  // Replace provider names
  sanitized = sanitized.replace(/anthropic/gi, 'AI Provider');
  sanitized = sanitized.replace(/openai/gi, 'AI Provider');
  sanitized = sanitized.replace(/claude/gi, 'Language Model');
  sanitized = sanitized.replace(/gpt-[0-9]/gi, 'Language Model');
  sanitized = sanitized.replace(/gemini/gi, 'AI Model');
  sanitized = sanitized.replace(/perplexity/gi, 'Search Engine');

  return {
    ...error,
    message: sanitized,
    sanitized: true
  };
}

module.exports = {
  encrypt,
  decrypt,
  resolveModel,
  resolveProvider,
  resolveEndpoint,
  getAPIKey,
  createSecureConfig,
  generateDynamicAlias,
  sanitizeHeaders,
  validateNoLeaks,
  sanitizeError,

  // Model Aliases (for import)
  MODEL: {
    STRATEGIC_REASONING: 'STRATEGIC_REASONING_ENGINE',
    ADVANCED_PROCESSOR: 'ADVANCED_LANGUAGE_PROCESSOR',
    RAPID_RESPONSE: 'RAPID_RESPONSE_UNIT',
    MULTIMODAL_VISION: 'MULTIMODAL_VISION_CORE',
    LEGACY_V3: 'LEGACY_REASONING_V3'
  },

  PROVIDER: {
    PRIMARY: 'PRIMARY_AI_PROVIDER',
    SECONDARY: 'SECONDARY_AI_PROVIDER',
    TERTIARY: 'TERTIARY_AI_PROVIDER',
    MULTIMODAL: 'MULTIMODAL_PROVIDER'
  }
};
