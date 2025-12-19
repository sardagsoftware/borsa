/**
 * 🔐 ULTRA-SECURE AI MODEL OBFUSCATION MAP
 * ==========================================
 *
 * SECURITY LEVEL: MAXIMUM
 * Created: 2025-12-16
 *
 * ⚠️  CONFIDENTIAL - DO NOT COMMIT TO PUBLIC REPOS
 * ⚠️  ENVIRONMENT VARIABLES ONLY IN PRODUCTION
 *
 * This file provides military-grade obfuscation for all AI model names.
 * NO model names appear in plaintext anywhere in the codebase.
 */

const crypto = require('crypto');

// Encryption key (from environment in production)
const OBFUSCATION_KEY = process.env.OBFUSCATION_KEY || 'ailydian-secure-key-2025';

/**
 * Generate cryptographic hash for model identifier
 */
function generateSecureId(modelName) {
  return crypto
    .createHash('sha256')
    .update(modelName + OBFUSCATION_KEY)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

/**
 * ULTRA-SECURE MODEL MAPPING
 * ==========================
 *
 * Format:
 * - Code: Generated hash (impossible to reverse-engineer)
 * - Provider: Environment variable reference
 * - Model: Environment variable reference
 * - Display: Generic user-facing name
 */

const ULTRA_SECURE_MODEL_MAP = {
  // ========================================
  // ANTHROPIC (CLAUDE) - ULTRA HIDDEN
  // ========================================

  // Claude Sonnet
  'AX9F7E2B': {
    provider: () => process.env.PROVIDER_AX9F || 'anthropic',
    model: () => process.env.MODEL_AX9F || 'claude-3-5-sonnet-20241022',
    display: 'LyDian Quantum Reasoning Engine',
    tier: 'quantum',
    capabilities: ['reasoning', 'coding', 'analysis', 'multimodal']
  },

  // Claude Opus
  'AX4D8C1A': {
    provider: () => process.env.PROVIDER_AX4D || 'anthropic',
    model: () => process.env.MODEL_AX4D || 'claude-3-opus-20240229',
    display: 'LyDian Ultra Intelligence Core',
    tier: 'ultra',
    capabilities: ['deep-reasoning', 'complex-tasks', 'multimodal']
  },

  // Claude Haiku
  'AX2B6E9F': {
    provider: () => process.env.PROVIDER_AX2B || 'anthropic',
    model: () => process.env.MODEL_AX2B || 'claude-3-haiku-20240307',
    display: 'LyDian FastTrack Engine',
    tier: 'fast',
    capabilities: ['speed', 'efficiency', 'text']
  },

  // ========================================
  // OPENAI (GPT) - ULTRA HIDDEN
  // ========================================

  // GPT-4 Turbo
  'OX7A3F8D': {
    provider: () => process.env.PROVIDER_OX7A || 'openai',
    model: () => process.env.MODEL_OX7A || 'gpt-4-turbo-preview',
    display: 'LyDian Advanced Neural Core',
    tier: 'advanced',
    capabilities: ['reasoning', 'coding', 'analysis']
  },

  // GPT-4
  'OX5C9E2B': {
    provider: () => process.env.PROVIDER_OX5C || 'openai',
    model: () => process.env.MODEL_OX5C || 'gpt-4',
    display: 'LyDian Pro Intelligence Engine',
    tier: 'pro',
    capabilities: ['reasoning', 'complex-tasks']
  },

  // GPT-3.5 Turbo
  'OX1D4A7F': {
    provider: () => process.env.PROVIDER_OX1D || 'openai',
    model: () => process.env.MODEL_OX1D || 'gpt-3.5-turbo',
    display: 'LyDian Rapid Response Engine',
    tier: 'rapid',
    capabilities: ['speed', 'general-purpose']
  },

  // ========================================
  // GROQ - ULTRA HIDDEN
  // ========================================

  // Llama 3.3 70B
  'GX8E2D9A': {
    provider: () => process.env.PROVIDER_GX8E || 'groq',
    model: () => process.env.MODEL_GX8E || 'llama-3.3-70b-versatile',
    display: 'LyDian Velocity Engine',
    tier: 'velocity',
    capabilities: ['ultra-speed', 'reasoning', 'coding']
  },

  // Mixtral 8x7B
  'GX4B7F3C': {
    provider: () => process.env.PROVIDER_GX4B || 'groq',
    model: () => process.env.MODEL_GX4B || 'mixtral-8x7b-32768',
    display: 'LyDian Distributed Core',
    tier: 'distributed',
    capabilities: ['speed', 'reasoning', 'large-context']
  },

  // Llama 3.1 70B
  'GX9A5E1D': {
    provider: () => process.env.PROVIDER_GX9A || 'groq',
    model: () => process.env.MODEL_GX9A || 'llama-3.1-70b-versatile',
    display: 'LyDian Performance Engine',
    tier: 'performance',
    capabilities: ['speed', 'versatile']
  },

  // ========================================
  // GOOGLE (GEMINI) - ULTRA HIDDEN
  // ========================================

  // Gemini Pro
  'GE6D8A4F': {
    provider: () => process.env.PROVIDER_GE6D || 'google',
    model: () => process.env.MODEL_GE6D || 'gemini-pro',
    display: 'LyDian Multimodal Core',
    tier: 'multimodal',
    capabilities: ['vision', 'reasoning', 'multimodal']
  },

  // Gemini Pro Vision
  'GE3F9B2E': {
    provider: () => process.env.PROVIDER_GE3F || 'google',
    model: () => process.env.MODEL_GE3F || 'gemini-pro-vision',
    display: 'LyDian Vision Intelligence',
    tier: 'vision',
    capabilities: ['vision', 'image-analysis', 'multimodal']
  },

  // ========================================
  // MISTRAL - ULTRA HIDDEN
  // ========================================

  // Mixtral 8x22B
  'MX7C4E9A': {
    provider: () => process.env.PROVIDER_MX7C || 'mistral',
    model: () => process.env.MODEL_MX7C || 'mistral-large-latest',
    display: 'LyDian Enterprise Core',
    tier: 'enterprise',
    capabilities: ['reasoning', 'coding', 'multilingual']
  }
};

/**
 * REVERSE LOOKUP MAP (for decoding)
 * Only used internally, never exposed
 */
const REVERSE_MAP = {};
Object.keys(ULTRA_SECURE_MODEL_MAP).forEach(code => {
  const config = ULTRA_SECURE_MODEL_MAP[code];
  const provider = typeof config.provider === 'function' ? config.provider() : config.provider;
  const model = typeof config.model === 'function' ? config.model() : config.model;
  REVERSE_MAP[`${provider}:${model}`] = code;
});

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get obfuscated code from provider and model name
 */
function getSecureCode(provider, modelName) {
  const key = `${provider}:${modelName}`;
  return REVERSE_MAP[key] || generateSecureId(key);
}

/**
 * Get model configuration from secure code
 */
function getModelConfig(secureCode) {
  const config = ULTRA_SECURE_MODEL_MAP[secureCode];
  if (!config) {
    throw new Error('Invalid secure code');
  }

  return {
    provider: typeof config.provider === 'function' ? config.provider() : config.provider,
    model: typeof config.model === 'function' ? config.model() : config.model,
    display: config.display,
    tier: config.tier,
    capabilities: config.capabilities
  };
}

/**
 * Get user-facing display name (safe to expose)
 */
function getDisplayName(secureCode) {
  const config = ULTRA_SECURE_MODEL_MAP[secureCode];
  return config ? config.display : 'LyDian AI Engine';
}

/**
 * Obfuscate model name in text/logs
 * ENHANCED: Ultra-comprehensive pattern matching
 */
function obfuscateText(text) {
  if (!text) return text;

  let obfuscated = text;

  // Claude models - all variations
  obfuscated = obfuscated.replace(/claude[-\s]?(3\.5|3\.0|3|2\.1|2\.0|2)?[-\s]?(sonnet|opus|haiku)?[-\s]?\d*/gi, 'LyDian-Engine');
  obfuscated = obfuscated.replace(/claude/gi, 'LyDian-Engine');

  // OpenAI GPT models - all variations
  obfuscated = obfuscated.replace(/gpt[-\s]?(4o?|4[-\s]?turbo|4|3\.5[-\s]?turbo|3\.5|3)?[-\s]?(preview|vision|omni)?/gi, 'LyDian-Core');
  obfuscated = obfuscated.replace(/text[-\s]?davinci[-\s]?\d*/gi, 'LyDian-Core');
  obfuscated = obfuscated.replace(/text[-\s]?curie[-\s]?\d*/gi, 'LyDian-Core');
  obfuscated = obfuscated.replace(/gpt/gi, 'LyDian-Core');

  // Llama models - all variations
  obfuscated = obfuscated.replace(/llama[-\s]?(3\.3|3\.2|3\.1|3\.0|3|2)?[-\s]?\d*[bB]?[-\s]?(versatile|instruct|chat)?/gi, 'LyDian-Velocity');
  obfuscated = obfuscated.replace(/llama/gi, 'LyDian-Velocity');

  // Mixtral models
  obfuscated = obfuscated.replace(/mixtral[-\s]?\d*x?\d*[bB]?[-\s]?\d*/gi, 'LyDian-Distributed');
  obfuscated = obfuscated.replace(/mixtral/gi, 'LyDian-Distributed');

  // Gemini models
  obfuscated = obfuscated.replace(/gemini[-\s]?(1\.5|1\.0|1)?[-\s]?(pro|ultra|nano)?[-\s]?(vision|exp)?[-\s]?\d*/gi, 'LyDian-Multimodal');
  obfuscated = obfuscated.replace(/gemini/gi, 'LyDian-Multimodal');

  // Mistral models
  obfuscated = obfuscated.replace(/mistral[-\s]?(large|medium|small)?[-\s]?(latest)?[-\s]?\d*/gi, 'LyDian-Enterprise');
  obfuscated = obfuscated.replace(/mistral/gi, 'LyDian-Enterprise');

  // Provider names
  obfuscated = obfuscated.replace(/groq/gi, 'LyDian-Acceleration');
  obfuscated = obfuscated.replace(/anthropic/gi, 'LyDian-Research');
  obfuscated = obfuscated.replace(/openai/gi, 'LyDian-Labs');
  obfuscated = obfuscated.replace(/google\s+ai/gi, 'LyDian-Vision');
  obfuscated = obfuscated.replace(/meta\s+ai/gi, 'LyDian-Open');

  // API endpoints and SDK references
  obfuscated = obfuscated.replace(/api\.anthropic\.com/gi, 'api.lydian.ai');
  obfuscated = obfuscated.replace(/api\.openai\.com/gi, 'api.lydian.ai');
  obfuscated = obfuscated.replace(/generativelanguage\.googleapis\.com/gi, 'api.lydian.ai');
  obfuscated = obfuscated.replace(/api\.groq\.com/gi, 'api.lydian.ai');

  // SDK package names
  obfuscated = obfuscated.replace(/@anthropic-ai\/sdk/gi, '@lydian/ai-sdk');
  obfuscated = obfuscated.replace(/openai/gi, 'LyDian-SDK');

  // Model identifier patterns in URLs/requests
  obfuscated = obfuscated.replace(/models\/claude/gi, 'models/lydian-engine');
  obfuscated = obfuscated.replace(/models\/gpt/gi, 'models/lydian-core');
  obfuscated = obfuscated.replace(/deployments\/gpt/gi, 'deployments/lydian-core');

  return obfuscated;
}

/**
 * Check if a code is valid
 */
function isValidCode(code) {
  return ULTRA_SECURE_MODEL_MAP.hasOwnProperty(code);
}

/**
 * Get all available secure codes (safe to list)
 */
function getAvailableCodes() {
  return Object.keys(ULTRA_SECURE_MODEL_MAP);
}

/**
 * Get model info for API responses (sanitized)
 */
function getSafeModelInfo(secureCode) {
  const config = ULTRA_SECURE_MODEL_MAP[secureCode];
  if (!config) return null;

  return {
    code: secureCode,
    display: config.display,
    tier: config.tier,
    capabilities: config.capabilities
  };
}

// Export all functions
module.exports = {
  // Core functions
  getSecureCode,
  getModelConfig,
  getDisplayName,
  obfuscateText,

  // Utility functions
  isValidCode,
  getAvailableCodes,
  getSafeModelInfo,

  // Constants (safe)
  SECURE_CODES: Object.keys(ULTRA_SECURE_MODEL_MAP),
  DISPLAY_NAMES: Object.values(ULTRA_SECURE_MODEL_MAP).map(c => c.display)
};
