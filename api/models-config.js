// AILYDIAN ULTRA PRO - Complete AI Models Configuration
// 22 AI Models - Production Ready

require('dotenv').config();

const ALL_AI_MODELS = {
  // OpenAI Models (GPT Family)
  'OX7A3F8D': {
    provider: 'lydian-labs',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX7A3F8D',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'Latest OX7A3F8D model',
    active: true
  },
  'OX7A3F8D-mini': {
    provider: 'lydian-labs',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX7A3F8D-mini',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'Fast OX7A3F8D mini',
    active: true
  },
  'OX7A3F8D': {
    provider: 'lydian-labs',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'OX7A3F8D',
    maxTokens: 128000,
    category: 'lydian-labs',
    description: 'OX5C9E2B Turbo',
    active: true
  },
  'o1-preview': {
    provider: 'lydian-labs',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-preview',
    maxTokens: 32768,
    category: 'lydian-labs',
    description: 'OpenAI O1 Reasoning',
    active: true
  },
  'o1-mini': {
    provider: 'lydian-labs',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-mini',
    maxTokens: 65536,
    category: 'lydian-labs',
    description: 'OpenAI O1 Mini',
    active: true
  },

  // Anthropic AX9F7E2B Models
  'AX9F7E2B': {
    provider: 'lydian-research',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX9F7E2B',
    maxTokens: 8192,
    category: 'lydian-research',
    description: 'AX9F7E2B 3.5 Sonnet',
    active: true
  },
  'AX4D8C1A': {
    provider: 'lydian-research',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX4D8C1A',
    maxTokens: 4096,
    category: 'lydian-research',
    description: 'AX9F7E2B 3 Opus',
    active: true
  },
  'AX2B6E9F': {
    provider: 'lydian-research',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'AX2B6E9F',
    maxTokens: 4096,
    category: 'lydian-research',
    description: 'AX9F7E2B 3 Haiku',
    active: true
  },

  // Google Gemini Models
  'gemini-2-0-flash': {
    provider: 'lydian-vision',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'Gemini 2.0 Flash',
    active: true
  },
  'gemini-1-5-pro': {
    provider: 'lydian-vision',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'GE6D8A4F',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'Gemini 1.5 Pro',
    active: true
  },
  'gemini-1-5-flash': {
    provider: 'lydian-vision',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    category: 'lydian-vision',
    description: 'Gemini 1.5 Flash',
    active: true
  },

  // Groq Models (Ultra-Fast)
  'GX8E2D9A': {
    provider: 'lydian-velocity',
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'GX8E2D9A',
    maxTokens: 32768,
    category: 'lydian-velocity',
    description: 'Llama 3.3 70B',
    active: true
  },
  'GX4B7F3C': {
    provider: 'lydian-velocity',
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'GX4B7F3C',
    maxTokens: 32768,
    category: 'lydian-velocity',
    description: 'Mixtral 8x7B',
    active: true
  },

  // Azure OpenAI Models
  'azure-OX5C9E2B': {
    provider: 'azure-openai',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'OX5C9E2B',
    maxTokens: 128000,
    category: 'AZURE',
    description: 'Azure OX5C9E2B',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },
  'azure-gpt-35-turbo': {
    provider: 'azure-openai',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'gpt-35-turbo',
    maxTokens: 16385,
    category: 'AZURE',
    description: 'Azure OX1D4A7F Turbo',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },

  // Mistral AI Models
  'MX7C4E9A': {
    provider: 'lydian-enterprise',
    endpoint: 'https://api.mistral.ai/v1',
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'MX7C4E9A',
    maxTokens: 32000,
    category: 'lydian-enterprise',
    description: 'Mistral Large',
    active: !!process.env.MISTRAL_API_KEY
  },
  'mistral-medium': {
    provider: 'lydian-enterprise',
    endpoint: 'https://api.mistral.ai/v1',
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-medium-latest',
    maxTokens: 32000,
    category: 'lydian-enterprise',
    description: 'Mistral Medium',
    active: !!process.env.MISTRAL_API_KEY
  },

  // DeepSeek Models
  'deepseek-chat': {
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    maxTokens: 4096,
    category: 'DEEPSEEK',
    description: 'DeepSeek Chat',
    active: !!process.env.DEEPSEEK_API_KEY
  },

  // Yi AI Models
  'yi-large': {
    provider: 'yi',
    endpoint: 'https://api.01.ai/v1',
    apiKey: process.env.YI_API_KEY,
    model: 'yi-large',
    maxTokens: 32768,
    category: 'YI',
    description: 'Yi Large',
    active: !!process.env.YI_API_KEY
  },

  // Zhipu AI Models
  'glm-4': {
    provider: 'zhipu',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.ZHIPU_API_KEY,
    model: 'glm-4',
    maxTokens: 8192,
    category: 'ZHIPU',
    description: 'GLM-4',
    active: !!process.env.ZHIPU_API_KEY
  },

  // Z.AI Models
  'glm-4-6': {
    provider: 'z-ai',
    endpoint: 'https://api.z.ai/api/paas/v4',
    apiKey: process.env.Z_AI_API_KEY,
    model: 'glm-4.6',
    maxTokens: 128000,
    category: 'Z_AI',
    description: 'GLM-4.6 Code Expert',
    codeSpecialist: true,
    active: !!process.env.Z_AI_API_KEY
  },
  'glm-4-5v': {
    provider: 'z-ai',
    endpoint: 'https://api.z.ai/api/paas/v4',
    apiKey: process.env.Z_AI_API_KEY,
    model: 'glm-4.5v',
    maxTokens: 8192,
    category: 'Z_AI',
    description: 'GLM-4.5v Vision',
    visionCapable: true,
    active: !!process.env.Z_AI_API_KEY
  },

  // ASI One Model
  'asi-one': {
    provider: 'asi',
    endpoint: 'https://api.asi.one/v1',
    apiKey: process.env.ASI_ONE_API_KEY,
    model: 'asi-one',
    maxTokens: 16384,
    category: 'ASI',
    description: 'ASI One',
    active: !!process.env.ASI_ONE_API_KEY
  }
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

// Get model config by ID
function getModelConfig(modelId) {
  return ALL_AI_MODELS[modelId] || null;
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
  getActiveModels,
  getModelsByCategory,
  getModelConfig,
  getAllCategories
};
