/**
 * AILYDIAN Ultra AI Model Obfuscation System
 *
 * Multi-layer encryption for AI model identities
 * NO AI MODEL NAMES ARE VISIBLE IN CODE OR LOGS
 *
 * @version 2.0.0
 * @license MIT
 */

const crypto = require('crypto');

// Secret salt - should be in env vars in production
const OBFUSCATION_SALT = process.env.AI_OBFUSCATION_SALT || 'LYDN_2026_ULTRA_SEC_7X9K';

/**
 * Ultra-encrypted AI Model Registry
 *
 * Format: PUBLIC_CODE -> { internal config }
 * No actual AI names appear anywhere
 */
const MODEL_REGISTRY = {
  // ═══════════════════════════════════════════════════
  // CLOUD AI MODELS (Existing - Enhanced)
  // ═══════════════════════════════════════════════════

  // Primary reasoning engine
  AX9F7E2B: {
    tier: 1,
    category: 'reasoning',
    endpoint: '/api/chat/AX9F7E2B',
    maxTokens: 200000,
    capabilities: ['reasoning', 'analysis', 'code', 'math'],
    fallback: 'OX5C9E2B',
  },

  // Secondary reasoning engine
  OX5C9E2B: {
    tier: 2,
    category: 'reasoning',
    endpoint: '/api/chat/OX5C9E2B',
    maxTokens: 128000,
    capabilities: ['reasoning', 'code', 'general'],
    fallback: 'GX8E2D9A',
  },

  // High-speed inference engine
  GX8E2D9A: {
    tier: 1,
    category: 'velocity',
    endpoint: '/api/chat/GX8E2D9A',
    maxTokens: 32000,
    capabilities: ['fast', 'general', 'chat'],
    fallback: 'OMEGA_SYS',
  },

  // Enterprise backup engine
  OMEGA_SYS: {
    tier: 3,
    category: 'enterprise',
    endpoint: '/api/chat/azure',
    maxTokens: 128000,
    capabilities: ['enterprise', 'reliable'],
    fallback: null,
  },

  // ═══════════════════════════════════════════════════
  // LOCAL/RAG MODELS (New - LocalRecall)
  // ═══════════════════════════════════════════════════

  // Primary local RAG engine
  LYRA_CORE_7X: {
    tier: 1,
    category: 'local_rag',
    endpoint: '/api/recall/search',
    maxTokens: 16000,
    capabilities: ['offline', 'rag', 'knowledge'],
    isLocal: true,
    fallback: 'MNEMO_LOCAL_9K',
  },

  // Offline-only memory engine
  MNEMO_LOCAL_9K: {
    tier: 2,
    category: 'offline',
    endpoint: '/api/recall/offline',
    maxTokens: 8000,
    capabilities: ['offline', 'memory', 'chromem'],
    isLocal: true,
    requiresNetwork: false,
    fallback: null,
  },

  // Cloud-enhanced RAG engine
  MNEMO_CLOUD_5R: {
    tier: 1,
    category: 'cloud_rag',
    endpoint: '/api/recall/cloud',
    maxTokens: 32000,
    capabilities: ['online', 'rag', 'postgres', 'hybrid_search'],
    isLocal: false,
    requiresNetwork: true,
    fallback: 'MNEMO_LOCAL_9K',
  },

  // Hybrid bridge engine
  SYNAPTIC_BRIDGE_3Z: {
    tier: 1,
    category: 'hybrid',
    endpoint: '/api/recall/hybrid',
    maxTokens: 32000,
    capabilities: ['hybrid', 'smart_routing', 'fallback'],
    isLocal: false,
    smartRouting: true,
    fallback: 'LYRA_CORE_7X',
  },

  // ═══════════════════════════════════════════════════
  // SPECIALIZED DOMAIN MODELS
  // ═══════════════════════════════════════════════════

  // IQ Test specialized engine
  NOVA_IQ_4M: {
    tier: 1,
    category: 'iq_specialist',
    endpoint: '/api/lydian-iq/solve',
    maxTokens: 16000,
    capabilities: ['mathematics', 'logic', 'patterns', 'iq_test'],
    domains: ['mathematics', 'science', 'coding', 'strategy'],
    ragCollection: 'iq_master',
    fallback: 'LYRA_CORE_7X',
  },

  // Medical specialist engine
  HELIX_MED_8Q: {
    tier: 1,
    category: 'medical',
    endpoint: '/api/medical/diagnosis',
    maxTokens: 32000,
    capabilities: ['medical', 'diagnosis', 'health'],
    ragCollection: 'medical_kb',
    fallback: 'AX9F7E2B',
  },

  // Legal specialist engine
  LEXIS_LAW_2P: {
    tier: 1,
    category: 'legal',
    endpoint: '/api/legal/research',
    maxTokens: 32000,
    capabilities: ['legal', 'turkish_law', 'contracts'],
    ragCollection: 'legal_kb',
    fallback: 'AX9F7E2B',
  },
};

/**
 * Domain to Model mapping
 */
const DOMAIN_MODEL_MAP = {
  // IQ domains
  mathematics: 'NOVA_IQ_4M',
  science: 'NOVA_IQ_4M',
  coding: 'NOVA_IQ_4M',
  logic: 'NOVA_IQ_4M',
  strategy: 'NOVA_IQ_4M',

  // Medical domains
  medical: 'HELIX_MED_8Q',
  health: 'HELIX_MED_8Q',
  diagnosis: 'HELIX_MED_8Q',

  // Legal domains
  legal: 'LEXIS_LAW_2P',
  law: 'LEXIS_LAW_2P',
  contracts: 'LEXIS_LAW_2P',

  // General domains
  general: 'SYNAPTIC_BRIDGE_3Z',
  conversation: 'GX8E2D9A',
  chat: 'GX8E2D9A',
  help: 'LYRA_CORE_7X',
};

/**
 * Generate encrypted model signature
 * @param {string} modelCode - Public model code
 * @returns {string} Encrypted signature
 */
function generateSignature(modelCode) {
  const timestamp = Math.floor(Date.now() / 60000); // 1-minute granularity
  const data = `${modelCode}:${OBFUSCATION_SALT}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Validate model signature
 * @param {string} modelCode - Public model code
 * @param {string} signature - Signature to validate
 * @returns {boolean} Validation result
 */
function validateSignature(modelCode, signature) {
  // Allow 2-minute window for signature validity
  for (let i = 0; i <= 2; i++) {
    const timestamp = Math.floor(Date.now() / 60000) - i;
    const data = `${modelCode}:${OBFUSCATION_SALT}:${timestamp}`;
    const expected = crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    if (expected === signature) return true;
  }
  return false;
}

/**
 * Get model configuration by public code
 * @param {string} modelCode - Public model code
 * @returns {object|null} Model configuration
 */
function getModel(modelCode) {
  return MODEL_REGISTRY[modelCode] || null;
}

/**
 * Get model for specific domain
 * @param {string} domain - Domain name
 * @returns {string} Model code
 */
function getModelForDomain(domain) {
  return DOMAIN_MODEL_MAP[domain.toLowerCase()] || 'SYNAPTIC_BRIDGE_3Z';
}

/**
 * Get all available models for a category
 * @param {string} category - Category name
 * @returns {string[]} Array of model codes
 */
function getModelsByCategory(category) {
  return Object.entries(MODEL_REGISTRY)
    .filter(([, config]) => config.category === category)
    .map(([code]) => code);
}

/**
 * Get fallback chain for a model
 * @param {string} modelCode - Starting model code
 * @returns {string[]} Fallback chain
 */
function getFallbackChain(modelCode) {
  const chain = [modelCode];
  let current = MODEL_REGISTRY[modelCode];

  while (current && current.fallback && !chain.includes(current.fallback)) {
    chain.push(current.fallback);
    current = MODEL_REGISTRY[current.fallback];
  }

  return chain;
}

/**
 * Check if model supports offline operation
 * @param {string} modelCode - Model code
 * @returns {boolean} Offline capability
 */
function supportsOffline(modelCode) {
  const model = MODEL_REGISTRY[modelCode];
  return model && (model.isLocal === true || model.requiresNetwork === false);
}

/**
 * Get optimal model based on conditions
 * @param {object} conditions - Selection conditions
 * @returns {string} Optimal model code
 */
function selectOptimalModel(conditions = {}) {
  const { domain, isOnline = true, preferSpeed = false, preferAccuracy = false } = conditions;

  // If domain specified, use domain mapping
  if (domain) {
    const domainModel = getModelForDomain(domain);
    const model = MODEL_REGISTRY[domainModel];

    // Check if model is available given network status
    if (!isOnline && model && model.requiresNetwork) {
      return model.fallback || 'MNEMO_LOCAL_9K';
    }

    return domainModel;
  }

  // If offline, use local models
  if (!isOnline) {
    return 'MNEMO_LOCAL_9K';
  }

  // Speed preference
  if (preferSpeed) {
    return 'GX8E2D9A';
  }

  // Accuracy preference
  if (preferAccuracy) {
    return 'AX9F7E2B';
  }

  // Default: hybrid bridge
  return 'SYNAPTIC_BRIDGE_3Z';
}

/**
 * Encrypt model reference for client-side use
 * @param {string} modelCode - Model code
 * @returns {string} Encrypted reference
 */
function encryptForClient(modelCode) {
  const signature = generateSignature(modelCode);
  return Buffer.from(`${modelCode}:${signature}`).toString('base64');
}

/**
 * Decrypt model reference from client
 * @param {string} encrypted - Encrypted reference
 * @returns {string|null} Model code or null if invalid
 */
function decryptFromClient(encrypted) {
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString('utf-8');
    const [modelCode, signature] = decoded.split(':');

    if (validateSignature(modelCode, signature) && MODEL_REGISTRY[modelCode]) {
      return modelCode;
    }
  } catch (_e) {
    // Invalid format
  }
  return null;
}

/**
 * Sanitize any AI model names from text (for logging)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeModelNames(text) {
  if (!text) return text;

  // List of patterns to sanitize (all known AI model names)
  const patterns = [
    /claude[- ]?[\d.]*[- ]?(opus|sonnet|haiku)?/gi,
    /gpt[- ]?[\d.]+[- ]?(turbo|vision|mini)?/gi,
    /gemini[- ]?[\d.]*[- ]?(pro|ultra|nano)?/gi,
    /llama[- ]?[\d.]+/gi,
    /mistral[- ]?[\d.]*[- ]?(large|medium|small)?/gi,
    /groq[- ]?\w*/gi,
    /anthropic/gi,
    /openai/gi,
    /google[- ]?ai/gi,
    /palm[- ]?[\d]*/gi,
    /bard/gi,
    /copilot/gi,
    /chatgpt/gi,
  ];

  let sanitized = text;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[LYRA_ENGINE]');
  });

  return sanitized;
}

module.exports = {
  MODEL_REGISTRY,
  DOMAIN_MODEL_MAP,
  generateSignature,
  validateSignature,
  getModel,
  getModelForDomain,
  getModelsByCategory,
  getFallbackChain,
  supportsOffline,
  selectOptimalModel,
  encryptForClient,
  decryptFromClient,
  sanitizeModelNames,
};
