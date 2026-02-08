// AILYDIAN ULTRA PRO - LyDian AI Engine Configuration
// Proprietary Multi-Engine Architecture - Production Ready

require('dotenv').config();

// Endpoint registry (encoded for security)
const _E = {
  L1: Buffer.from('aHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MQ==', 'base64').toString(),
  L2: Buffer.from('aHR0cHM6Ly9hcGkuYW50aHJvcGljLmNvbS92MQ==', 'base64').toString(),
  L3: Buffer.from('aHR0cHM6Ly9nZW5lcmF0aXZlbGFuZ3VhZ2UuZ29vZ2xlYXBpcy5jb20vdjFiZXRh', 'base64').toString(),
  L4: Buffer.from('aHR0cHM6Ly9hcGkuZ3JvcS5jb20vb3BlbmFpL3Yx', 'base64').toString(),
  L5: Buffer.from('aHR0cHM6Ly9hcGkubWlzdHJhbC5haS92MQ==', 'base64').toString(),
  L6: Buffer.from('aHR0cHM6Ly9hcGkuZGVlcHNlZWsuY29tL3Yx', 'base64').toString(),
  L7: Buffer.from('aHR0cHM6Ly9hcGkuMDEuYWkvdjE=', 'base64').toString(),
  L8: Buffer.from('aHR0cHM6Ly9vcGVuLmJpZ21vZGVsLmNuL2FwaS9wYWFzL3Y0', 'base64').toString(),
  L9: Buffer.from('aHR0cHM6Ly9hcGkuei5haS9hcGkvcGFhcy92NA==', 'base64').toString(),
  L10: Buffer.from('aHR0cHM6Ly9hcGkuYXNpLm9uZS92MQ==', 'base64').toString(),
};

// LyDian AI Engine Registry
const ALL_AI_MODELS = {
  // LyDian Labs - Primary Engines
  'OX7A3F8D': {
    provider: 'lydian-labs',
    endpoint: _E.L1,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX7A3F8D',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'LyDian Primary Engine',
    active: true
  },
  'OX7A3F8D-mini': {
    provider: 'lydian-labs',
    endpoint: _E.L1,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX7A3F8D-mini',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'LyDian Fast Engine',
    active: true
  },
  'OX5C9E2B': {
    provider: 'lydian-labs',
    endpoint: _E.L1,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX5C9E2B',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'LyDian Turbo Engine',
    active: true
  },
  'OX1E9R4P': {
    provider: 'lydian-labs',
    endpoint: _E.L1,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-preview',
    maxTokens: 32768,
    category: 'lydian-labs',
    description: 'LyDian Reasoning Engine',
    active: true
  },
  'OX1M7N2K': {
    provider: 'lydian-labs',
    endpoint: _E.L1,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-mini',
    maxTokens: 65536,
    category: 'lydian-labs',
    description: 'LyDian Reasoning Lite',
    active: true
  },

  // LyDian Research - Advanced Reasoning Engines
  'AX9F7E2B': {
    provider: 'lydian-research',
    endpoint: _E.L2,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX9F7E2B',
    maxTokens: 8192,
    category: 'lydian-research',
    description: 'LyDian Advanced Engine',
    active: true
  },
  'AX4D8C1A': {
    provider: 'lydian-research',
    endpoint: _E.L2,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX4D8C1A',
    maxTokens: 4096,
    category: 'lydian-research',
    description: 'LyDian Deep Reasoning',
    active: true
  },
  'AX2B6E9F': {
    provider: 'lydian-research',
    endpoint: _E.L2,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX2B6E9F',
    maxTokens: 4096,
    category: 'lydian-research',
    description: 'LyDian Instant Engine',
    active: true
  },

  // LyDian Vision - Multimodal Engines
  'VX2F8A0E': {
    provider: 'lydian-vision',
    endpoint: _E.L3,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'LyDian Vision Flash',
    active: true
  },
  'VX1P5R0A': {
    provider: 'lydian-vision',
    endpoint: _E.L3,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'GE6D8A4F',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'LyDian Vision Pro',
    active: true
  },
  'VX1F5L0B': {
    provider: 'lydian-vision',
    endpoint: _E.L3,
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'LyDian Vision Lite',
    active: true
  },

  // LyDian Velocity - Ultra-Fast Inference Engines
  'GX8E2D9A': {
    provider: 'lydian-velocity',
    endpoint: _E.L4,
    apiKey: process.env.GROQ_API_KEY,
    model: 'GX8E2D9A',
    maxTokens: 32768,
    category: 'lydian-velocity',
    description: 'LyDian Velocity Prime',
    active: true
  },
  'GX4B7F3C': {
    provider: 'lydian-velocity',
    endpoint: _E.L4,
    apiKey: process.env.GROQ_API_KEY,
    model: 'GX4B7F3C',
    maxTokens: 32768,
    category: 'lydian-velocity',
    description: 'LyDian Velocity Ensemble',
    active: true
  },

  // LyDian Cloud - Enterprise Backup Engines
  'CX5E9B2A': {
    provider: 'lydian-cloud',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'OX5C9E2B',
    maxTokens: 128000,
    category: 'lydian-cloud',
    description: 'LyDian Cloud Primary',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },
  'CX3T5R1B': {
    provider: 'lydian-cloud',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'gpt-35-turbo',
    maxTokens: 16385,
    category: 'lydian-cloud',
    description: 'LyDian Cloud Turbo',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },

  // LyDian Enterprise - Specialized Engines
  'MX7C4E9A': {
    provider: 'lydian-enterprise',
    endpoint: _E.L5,
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'MX7C4E9A',
    maxTokens: 32000,
    category: 'lydian-enterprise',
    description: 'LyDian Enterprise Large',
    active: !!process.env.MISTRAL_API_KEY
  },
  'MX3M5D7E': {
    provider: 'lydian-enterprise',
    endpoint: _E.L5,
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-medium-latest',
    maxTokens: 32000,
    category: 'lydian-enterprise',
    description: 'LyDian Enterprise Medium',
    active: !!process.env.MISTRAL_API_KEY
  },

  // LyDian Quantum - Deep Analysis Engines
  'QX7D4S2K': {
    provider: 'lydian-quantum',
    endpoint: _E.L6,
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    maxTokens: 4096,
    category: 'lydian-quantum',
    description: 'LyDian Quantum Chat',
    active: !!process.env.DEEPSEEK_API_KEY
  },

  // LyDian Apex - Extended Capacity Engines
  'YX8L4A2G': {
    provider: 'lydian-apex',
    endpoint: _E.L7,
    apiKey: process.env.YI_API_KEY,
    model: 'yi-large',
    maxTokens: 32768,
    category: 'lydian-apex',
    description: 'LyDian Apex Large',
    active: !!process.env.YI_API_KEY
  },

  // LyDian Neural - Cognitive Engines
  'ZX4G8N1L': {
    provider: 'lydian-neural',
    endpoint: _E.L8,
    apiKey: process.env.ZHIPU_API_KEY,
    model: 'glm-4',
    maxTokens: 8192,
    category: 'lydian-neural',
    description: 'LyDian Neural Core',
    active: !!process.env.ZHIPU_API_KEY
  },

  // LyDian Code - Code Specialist Engines
  'ZX4C6E9A': {
    provider: 'lydian-code',
    endpoint: _E.L9,
    apiKey: process.env.Z_AI_API_KEY,
    model: 'glm-4.6',
    maxTokens: 128000,
    category: 'lydian-code',
    description: 'LyDian Code Expert',
    codeSpecialist: true,
    active: !!process.env.Z_AI_API_KEY
  },
  'ZX4V5E9B': {
    provider: 'lydian-code',
    endpoint: _E.L9,
    apiKey: process.env.Z_AI_API_KEY,
    model: 'glm-4.5v',
    maxTokens: 8192,
    category: 'lydian-code',
    description: 'LyDian Code Vision',
    visionCapable: true,
    active: !!process.env.Z_AI_API_KEY
  },

  // LyDian Frontier - Next-Gen Engine
  'FX1A3S7I': {
    provider: 'lydian-frontier',
    endpoint: _E.L10,
    apiKey: process.env.ASI_ONE_API_KEY,
    model: 'asi-one',
    maxTokens: 16384,
    category: 'lydian-frontier',
    description: 'LyDian Frontier Engine',
    active: !!process.env.ASI_ONE_API_KEY
  }
};

// Legacy key mapping for backward compatibility (obfuscated)
const LEGACY_KEY_MAP = {
  'lx-preview': 'OX1E9R4P',
  'lx-mini': 'OX1M7N2K',
  'lx-velocity-flash': 'VX2F8A0E',
  'lx-velocity-pro': 'VX1P5R0A',
  'lx-velocity-lite': 'VX1F5L0B',
  'lx-cloud-pro': 'CX5E9B2A',
  'lx-cloud-lite': 'CX3T5R1B',
  'lx-edge-medium': 'MX3M5D7E',
  'lx-quantum': 'QX7D4S2K',
  'lx-horizon': 'YX8L4A2G',
  'lx-code': 'ZX4G8N1L',
  'lx-code-expert': 'ZX4C6E9A',
  'lx-code-vision': 'ZX4V5E9B',
  'lx-frontier': 'FX1A3S7I',
};

// Get all active models
function getActiveModels() {
  return Object.entries(ALL_AI_MODELS)
    .filter(([_, config]) => config.active && config.apiKey)
    .map(([id, config]) => ({
      id,
      ...config
    }));
}

// Get models by category
function getModelsByCategory(category) {
  return Object.entries(ALL_AI_MODELS)
    .filter(([_, config]) => config.category === category && config.active && config.apiKey)
    .map(([id, config]) => ({
      id,
      ...config
    }));
}

// Get model config by ID (supports legacy keys)
function getModelConfig(modelId) {
  const resolvedId = LEGACY_KEY_MAP[modelId] || modelId;
  return ALL_AI_MODELS[resolvedId] || ALL_AI_MODELS[modelId] || null;
}

// Get all categories
function getAllCategories() {
  const categories = new Set();
  Object.values(ALL_AI_MODELS).forEach(model => {
    if (model.active && model.apiKey) {
      categories.add(model.category);
    }
  });
  return Array.from(categories);
}

module.exports = {
  ALL_AI_MODELS,
  LEGACY_KEY_MAP,
  getActiveModels,
  getModelsByCategory,
  getModelConfig,
  getAllCategories
};
