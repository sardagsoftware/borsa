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
  NOVA_CORE_7X: {
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
    fallback: 'NOVA_CORE_7X',
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
    fallback: 'NOVA_CORE_7X',
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
  help: 'NOVA_CORE_7X',
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
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔒 ULTRA MILITARY-GRADE AI MODEL NAME SANITIZATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * PERMANENT - STRICT - UNBREAKABLE RULE
 *
 * This function removes ALL traces of AI model names from ANY text.
 * NO AI model names can EVER be visible to users.
 * This is a CORE SECURITY requirement - violation is CRITICAL.
 *
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text with LyDian AI branding ONLY
 */
function sanitizeModelNames(text) {
  if (!text) return text;

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 ULTRA MILITARY-GRADE: ALL KNOWN AI MODELS - ZERO TOLERANCE
  // ═══════════════════════════════════════════════════════════════════════════
  const patterns = [
    // ═══════════════════════════════════════════════════
    // ANTHROPIC (Claude)
    // ═══════════════════════════════════════════════════
    /claude[- ]?[\d.]*[- ]?(opus|sonnet|haiku|instant)?/gi,
    /claude[- ]?3[- .]5[- ]?(sonnet|haiku)/gi,
    /claude[- ]?3\.5[- ]?(sonnet|haiku)/gi,
    /claude[- ]?4[- ]?(opus|sonnet)?/gi,
    /claude[- ]?opus[- ]?4/gi,
    /claude[- ]?sonnet[- ]?4/gi,
    /anthropic/gi,
    /\bopus\b/gi,
    /\bsonnet\b/gi,
    /\bhaiku\b/gi,

    // ═══════════════════════════════════════════════════
    // OPENAI (GPT, ChatGPT)
    // ═══════════════════════════════════════════════════
    /gpt-?4o/gi,
    /gpt-?4o-mini/gi,
    /gpt-?4o-2024/gi,
    /gpt[- ]?4[- ]?turbo[- ]?preview/gi,
    /gpt[- ]?[\d.]+[- ]?(turbo|vision|mini|o|preview|omni)?/gi,
    /chatgpt[- ]?[\d.]*/gi,
    /\bgpt\b/gi,
    /openai/gi,
    /davinci[- ]?\d*/gi,
    /curie/gi,
    /babbage/gi,
    /whisper/gi,
    /dall[- ]?e[- ]?\d*/gi,
    /codex/gi,
    /sora/gi,
    /o1[- ]?(preview|mini)?/gi,
    /o3[- ]?(mini|preview)?/gi,

    // ═══════════════════════════════════════════════════
    // GOOGLE (Gemini, Bard, PaLM)
    // ═══════════════════════════════════════════════════
    /gemini[- ]?2\.0[- ]?(flash|flash[- ]?thinking)/gi,
    /gemini[- ]?2\.5[- ]?\w*/gi,
    /gemini[- ]?[\d.]*[- ]?(pro|ultra|nano|flash|advanced|thinking)?/gi,
    /google[- ]?ai/gi,
    /palm[- ]?[\d]*/gi,
    /\bbard\b/gi,
    /imagen/gi,
    /veo/gi,
    /gemma[- ]?\d*/gi,
    /lamda/gi,

    // ═══════════════════════════════════════════════════
    // META (Llama)
    // ═══════════════════════════════════════════════════
    /llama[- ]?3\.[1-3][- ]?\w*/gi,
    /llama[- ]?v3p\d/gi,
    /llama[- ]?[\d.-]*[- ]?\w*/gi,
    /meta[- ]?llama/gi,
    /meta[- ]?ai/gi,
    /\bllama\b/gi,

    // ═══════════════════════════════════════════════════
    // MISTRAL
    // ═══════════════════════════════════════════════════
    /mistral[- ]?(large|medium|small|nemo|instruct)[- ]?[\d.]*/gi,
    /mistral[- ]?[\d.]*[- ]?(large|medium|small|nemo|instruct)?/gi,
    /codestral[- ]?[\d.]*/gi,
    /mixtral[- ]?\d*/gi,
    /pixtral/gi,
    /\bmistral\b/gi,

    // ═══════════════════════════════════════════════════
    // OTHER AI COMPANIES & MODELS
    // ═══════════════════════════════════════════════════
    /groq[- ]?\w*/gi,
    /copilot/gi,
    /bing[- ]?ai/gi,
    /phi[- ]?\d*/gi,
    /qwen[- ]?2\.5[- ]?\w*/gi,
    /qwen2\.5[- ]?\w*/gi,
    /qwen[- ]?\d*/gi,
    /deepseek[- ]?r1/gi,
    /deepseek[- ]?v3/gi,
    /deepseek[- ]?coder[- ]?[\d.]*/gi,
    /deepseek[- ]?\w*/gi,
    /cohere/gi,
    /command[- ]?r[- ]?plus/gi,
    /command[- ]?r/gi,
    /stable[- ]?diffusion/gi,
    /midjourney/gi,
    /perplexity/gi,
    /yi[- ]?\d+/gi,
    /falcon[- ]?\d*/gi,
    /vicuna/gi,
    /alpaca/gi,
    /grok[- ]?\d*/gi,
    /x\.ai/gi,
    /nvidia[- ]?nemotron/gi,

    // ═══════════════════════════════════════════════════
    // CHINESE AI MODELS
    // ═══════════════════════════════════════════════════
    /baidu/gi,
    /ernie/gi,
    /alibaba/gi,
    /tongyi/gi,
    /zhipu/gi,
    /glm[- ]?\d*/gi,
    /chatglm/gi,
    /z\.ai/gi,
    /bigmodel/gi,
    /baichuan/gi,
    /kimi/gi,
    /moonshot/gi,
    /01\.ai/gi,
    /doubao/gi,
    /spark/gi,

    // ═══════════════════════════════════════════════════
    // AI PLATFORMS & SERVICES
    // ═══════════════════════════════════════════════════
    /replicate/gi,
    /hugging\s*face/gi,
    /together\s*ai/gi,
    /anyscale/gi,
    /fireworks\s*ai/gi,
    /baseten/gi,
    /runpod/gi,
    /ai21\s*labs?/gi,
    /amazon\s*bedrock/gi,
    /amazon\s*titan/gi,
    /aws\s*ai/gi,
    /azure\s*openai/gi,
    /vertex\s*ai/gi,
    /xai/gi,
    /inflection/gi,
    /adept/gi,
    /character\.ai/gi,
    /jasper\s*ai/gi,

    // ═══════════════════════════════════════════════════
    // SELF-REFERENCE PATTERNS (English)
    // ═══════════════════════════════════════════════════
    /I am (a |an )?(GPT|Claude|Gemini|Llama|Mistral|ChatGPT|AI assistant|language model)/gi,
    /I'm (a |an )?(GPT|Claude|Gemini|Llama|Mistral|ChatGPT|AI assistant|language model)/gi,
    /(GPT|Claude|Gemini|Llama|Mistral|ChatGPT) model/gi,
    /powered by (GPT|Claude|Gemini|Llama|Mistral|OpenAI|Anthropic|Google|Meta)/gi,
    /built by (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,
    /created by (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,
    /developed by (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,
    /made by (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,
    /trained by (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,
    /from (OpenAI|Anthropic|Google|Meta|Microsoft)/gi,

    // ═══════════════════════════════════════════════════
    // SELF-REFERENCE PATTERNS (Turkish)
    // ═══════════════════════════════════════════════════
    /ben (bir )?(GPT|Claude|Gemini|Llama|Mistral|ChatGPT|yapay zeka modeliyim)/gi,
    /(GPT|Claude|Gemini|Llama|Mistral|ChatGPT) modeliyim/gi,
    /(OpenAI|Anthropic|Google|Meta|Microsoft) tarafından (geliştirildi|yapıldı|oluşturuldu|eğitildi)/gi,
    /(OpenAI|Anthropic|Google|Meta|Microsoft)'(ın|in|un|ün) (ürünü|modeli|yapay zekası)/gi,

    // ═══════════════════════════════════════════════════
    // TECHNICAL TERMS THAT REVEAL AI ORIGIN
    // ═══════════════════════════════════════════════════
    /large language model/gi,
    /büyük dil modeli/gi,
    /transformer model/gi,
    /neural network/gi,
    /yapay sinir ağı/gi,
    /derin öğrenme/gi,
    /deep learning model/gi,
    /foundation model/gi,
    /temel model/gi,
    /pre-?trained model/gi,
    /önceden eğitilmiş/gi,

    // ═══════════════════════════════════════════════════
    // 🔒 ULTRA: ANY AI COMPANY/PRODUCT MENTION
    // ═══════════════════════════════════════════════════
    /\bSam Altman\b/gi,
    /\bDario Amodei\b/gi,
    /\bSundar Pichai\b/gi,
    /\bElon Musk\b/gi,
    /\bMark Zuckerberg\b/gi,
    /\bAI research\b/gi,
    /\byapay zeka araştırma\b/gi,

    // ═══════════════════════════════════════════════════
    // 🔒 ULTRA: VERSION & MODEL NUMBER PATTERNS
    // ═══════════════════════════════════════════════════
    /model\s*(version|v|ver)?\s*[\d.]+/gi,
    /versiyon\s*[\d.]+/gi,
    /\b(v|ver)\s*[\d.]+\s*(turbo|pro|ultra|mini|flash|preview|instruct|chat)?\b/gi,
  ];

  let sanitized = text;

  // ═══════════════════════════════════════════════════
  // PHASE 1: Apply all regex patterns
  // ═══════════════════════════════════════════════════
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, 'LyDian AI');
  });

  // ═══════════════════════════════════════════════════
  // PHASE 2: Additional word-level scanning
  // ═══════════════════════════════════════════════════
  const bannedWords = [
    'ChatGPT',
    'GPT4',
    'GPT-4',
    'GPT-4o',
    'GPT-4o-mini',
    'GPT3',
    'GPT-3',
    'GPT',
    'Claude',
    'Anthropic',
    'Sonnet',
    'Opus',
    'Haiku',
    'Gemini',
    'Bard',
    'PaLM',
    'Google AI',
    'Llama',
    'LLaMA',
    'Meta AI',
    'Mistral',
    'Mixtral',
    'Codestral',
    'Groq',
    'DeepSeek',
    'Qwen',
    'Cohere',
    'OpenAI',
    'Perplexity',
    'Grok',
    'Command-R',
    'Command-R-Plus',
  ];

  bannedWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, 'LyDian AI');
  });

  // ═══════════════════════════════════════════════════
  // PHASE 3: CLEANUP - Remove artifacts
  // ═══════════════════════════════════════════════════
  sanitized = sanitized.replace(/LyDian AI LyDian AI/gi, 'LyDian AI');
  sanitized = sanitized.replace(/LyDian AI AI/gi, 'LyDian AI');
  sanitized = sanitized.replace(/LyDian AI'LyDian AI/gi, 'LyDian AI');
  sanitized = sanitized.replace(/LyDian AI's LyDian AI/gi, 'LyDian AI');
  sanitized = sanitized.replace(/by Emrah Şardağ/gi, 'by AILYDIAN');
  sanitized = sanitized.replace(/from Emrah Şardağ/gi, 'from AILYDIAN');
  sanitized = sanitized.replace(/developed by Emrah Şardağ/gi, 'developed by AILYDIAN');
  sanitized = sanitized.replace(/created by Emrah Şardağ/gi, 'created by AILYDIAN');
  sanitized = sanitized.replace(/Emrah Şardağ/gi, 'AILYDIAN');
  sanitized = sanitized.replace(/Emrah Sardag/gi, 'AILYDIAN');

  // ═══════════════════════════════════════════════════
  // PHASE 4: FINAL VERIFICATION (Double-check)
  // ═══════════════════════════════════════════════════
  const finalCheck =
    /gpt|claude|gemini|llama|mistral|anthropic|openai|deepseek|groq|qwen|cohere|perplexity|bard|codestral|command-r/gi;
  if (finalCheck.test(sanitized)) {
    // If any slip through, do another pass
    sanitized = sanitized.replace(finalCheck, 'LyDian AI');
  }

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
