// AILYDIAN ULTRA PRO - Complete AI Models Configuration
// 22 AI Models - Production Ready

require('dotenv').config();

const ALL_AI_MODELS = {
  // OpenAI Models (GPT Family)
  'gpt-4o': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxTokens: 128000,
    category: 'OPENAI',
    description: 'Latest GPT-4o model',
    active: true
  },
  'gpt-4o-mini': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    maxTokens: 128000,
    category: 'OPENAI',
    description: 'Fast GPT-4o mini',
    active: true
  },
  'gpt-4-turbo': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    maxTokens: 128000,
    category: 'OPENAI',
    description: 'GPT-4 Turbo',
    active: true
  },
  'o1-preview': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-preview',
    maxTokens: 32768,
    category: 'OPENAI',
    description: 'OpenAI O1 Reasoning',
    active: true
  },
  'o1-mini': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'o1-mini',
    maxTokens: 65536,
    category: 'OPENAI',
    description: 'OpenAI O1 Mini',
    active: true
  },

  // Anthropic Claude Models
  'claude-3-5-sonnet': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192,
    category: 'ANTHROPIC',
    description: 'Claude 3.5 Sonnet',
    active: true
  },
  'claude-3-opus': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-opus-20240229',
    maxTokens: 4096,
    category: 'ANTHROPIC',
    description: 'Claude 3 Opus',
    active: true
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-haiku-20240307',
    maxTokens: 4096,
    category: 'ANTHROPIC',
    description: 'Claude 3 Haiku',
    active: true
  },

  // Google Gemini Models
  'gemini-2-0-flash': {
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-2.0-flash-exp',
    maxTokens: 8192,
    category: 'GOOGLE',
    description: 'Gemini 2.0 Flash',
    active: true
  },
  'gemini-1-5-pro': {
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-1.5-pro',
    maxTokens: 8192,
    category: 'GOOGLE',
    description: 'Gemini 1.5 Pro',
    active: true
  },
  'gemini-1-5-flash': {
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 8192,
    category: 'GOOGLE',
    description: 'Gemini 1.5 Flash',
    active: true
  },

  // Groq Models (Ultra-Fast)
  'llama-3-3-70b': {
    provider: 'groq',
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    maxTokens: 32768,
    category: 'GROQ',
    description: 'Llama 3.3 70B',
    active: true
  },
  'mixtral-8x7b': {
    provider: 'groq',
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
    model: 'mixtral-8x7b-32768',
    maxTokens: 32768,
    category: 'GROQ',
    description: 'Mixtral 8x7B',
    active: true
  },

  // Azure OpenAI Models
  'azure-gpt-4': {
    provider: 'azure-openai',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 128000,
    category: 'AZURE',
    description: 'Azure GPT-4',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },
  'azure-gpt-35-turbo': {
    provider: 'azure-openai',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    model: 'gpt-35-turbo',
    maxTokens: 16385,
    category: 'AZURE',
    description: 'Azure GPT-3.5 Turbo',
    active: !!process.env.AZURE_OPENAI_ENDPOINT
  },

  // Mistral AI Models
  'mistral-large': {
    provider: 'mistral',
    endpoint: 'https://api.mistral.ai/v1',
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-large-latest',
    maxTokens: 32000,
    category: 'MISTRAL',
    description: 'Mistral Large',
    active: !!process.env.MISTRAL_API_KEY
  },
  'mistral-medium': {
    provider: 'mistral',
    endpoint: 'https://api.mistral.ai/v1',
    apiKey: process.env.MISTRAL_API_KEY,
    model: 'mistral-medium-latest',
    maxTokens: 32000,
    category: 'MISTRAL',
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
  },

  // Ling-1T Model (inclusionAI via ZenMux)
  'ling-1t': {
    provider: 'zenmux',
    endpoint: 'https://zenmux.ai/api/v1',
    apiKey: process.env.ZENMUX_API_KEY,
    model: 'inclusionai/ling-1t',
    maxTokens: 128000,
    category: 'ZENMUX',
    description: 'Ling-1T: 1T Parameter MoE Reasoning Model',
    codeSpecialist: true,
    mathSpecialist: true,
    visualReasoning: true,
    longContext: true,
    active: !!process.env.ZENMUX_API_KEY
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
