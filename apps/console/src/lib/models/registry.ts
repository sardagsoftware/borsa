/**
 * AI POWER PANEL - Model Registry
 * 21 Real AI Models with Parameters, Type, and Capabilities
 *
 * GOVERNANCE: White-hat only, KVKK/GDPR/PDPL compliant
 * SECURITY: No PII, system metrics only
 */

export type ModelType = 'dense' | 'moe' | 'closed';
export type ModelProvider = 'azure' | 'openai' | 'anthropic' | 'google' | 'groq' | 'local';

export interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  paramsB: number | null; // Billions of parameters
  provider: ModelProvider;

  // MoE specific
  moe_k?: number; // Active experts
  moe_n?: number; // Total experts

  // Closed model specific (Azure deployments)
  deployment?: string;

  // Operational limits
  maxTokens?: number;
  contextWindow?: number;

  // Cost (USD per 1M tokens)
  costPer1M?: number;

  // Capabilities
  capabilities?: {
    chat?: boolean;
    vision?: boolean;
    reasoning?: boolean;
    function_calling?: boolean;
    streaming?: boolean;
  };

  // Status
  status: 'active' | 'degraded' | 'inactive';
}

/**
 * COMPLETE 21 MODEL REGISTRY
 * Real data from Firildak AI Engine + Known model specs
 */
export const AI_MODELS: AIModel[] = [
  // ========================================
  // AZURE OPENAI MODELS (Closed - Production Deployments)
  // ========================================
  {
    id: 'azure-gpt-4-turbo',
    name: 'Azure GPT-4 Turbo',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'azure',
    deployment: 'gpt-4-turbo',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1M: 10.0,
    capabilities: {
      chat: true,
      vision: true,
      function_calling: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'azure-gpt-35-turbo',
    name: 'Azure GPT-3.5 Turbo',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'azure',
    deployment: 'gpt-35-turbo',
    maxTokens: 16385,
    contextWindow: 16385,
    costPer1M: 2.0,
    capabilities: {
      chat: true,
      function_calling: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'azure-dall-e-3',
    name: 'Azure DALL-E 3',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'azure',
    deployment: 'dall-e-3',
    maxTokens: 4000,
    costPer1M: 40.0,
    capabilities: {
      vision: true
    },
    status: 'active'
  },

  // ========================================
  // GOOGLE VERTEX AI MODELS
  // ========================================
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    type: 'closed',
    paramsB: null, // Proprietary (estimated ~540B MoE)
    provider: 'google',
    maxTokens: 32768,
    contextWindow: 32768,
    costPer1M: 0.5,
    capabilities: {
      chat: true,
      function_calling: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'google',
    maxTokens: 32768,
    contextWindow: 32768,
    costPer1M: 2.0,
    capabilities: {
      chat: true,
      vision: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'text-bison',
    name: 'Text-Bison',
    type: 'closed',
    paramsB: null, // Proprietary (PaLM 2 base)
    provider: 'google',
    maxTokens: 8192,
    contextWindow: 8192,
    costPer1M: 1.0,
    capabilities: {
      chat: true
    },
    status: 'active'
  },

  // ========================================
  // OPENAI DIRECT MODELS
  // ========================================
  {
    id: 'openai-gpt-4-turbo',
    name: 'OpenAI GPT-4 Turbo',
    type: 'closed',
    paramsB: null, // Proprietary (estimated 1.76T MoE)
    provider: 'openai',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1M: 10.0,
    capabilities: {
      chat: true,
      vision: true,
      function_calling: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'openai-gpt-35-turbo',
    name: 'OpenAI GPT-3.5 Turbo',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'openai',
    maxTokens: 16385,
    contextWindow: 16385,
    costPer1M: 2.0,
    capabilities: {
      chat: true,
      function_calling: true,
      streaming: true
    },
    status: 'active'
  },

  // ========================================
  // ANTHROPIC CLAUDE MODELS
  // ========================================
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'anthropic',
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1M: 15.0,
    capabilities: {
      chat: true,
      vision: true,
      function_calling: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'anthropic',
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1M: 3.0,
    capabilities: {
      chat: true,
      vision: true,
      function_calling: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    type: 'closed',
    paramsB: null, // Proprietary
    provider: 'anthropic',
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1M: 0.5,
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  },

  // ========================================
  // GROQ ULTRA-FAST MODELS
  // ========================================
  {
    id: 'groq-llama-3.3-70b',
    name: 'Llama 3.3 70B (Groq)',
    type: 'dense',
    paramsB: 70,
    provider: 'groq',
    maxTokens: 8192,
    contextWindow: 8192,
    costPer1M: 0.59,
    capabilities: {
      chat: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8×7B (Groq)',
    type: 'moe',
    paramsB: 46.7, // Total params
    moe_k: 2, // Active experts per token
    moe_n: 8, // Total experts
    provider: 'groq',
    maxTokens: 32768,
    contextWindow: 32768,
    costPer1M: 0.24,
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'llama2-70b-4096',
    name: 'Llama 2 70B (Groq)',
    type: 'dense',
    paramsB: 70,
    provider: 'groq',
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1M: 0.70,
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  },

  // ========================================
  // LOCAL / OPEN-SOURCE MODELS
  // ========================================
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    type: 'dense',
    paramsB: 8,
    provider: 'local',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    type: 'dense',
    paramsB: 70,
    provider: 'local',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    type: 'dense',
    paramsB: 7,
    provider: 'local',
    maxTokens: 32768,
    contextWindow: 32768,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'mixtral-8x22b',
    name: 'Mixtral 8×22B',
    type: 'moe',
    paramsB: 176, // Total params
    moe_k: 2, // Active experts per token
    moe_n: 8, // Total experts
    provider: 'local',
    maxTokens: 65536,
    contextWindow: 65536,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      streaming: true,
      reasoning: true
    },
    status: 'active'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 (Reasoning)',
    type: 'dense',
    paramsB: 671, // 671B parameters
    provider: 'local',
    maxTokens: 64000,
    contextWindow: 64000,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      reasoning: true,
      streaming: true
    },
    status: 'active'
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B',
    type: 'dense',
    paramsB: 72,
    provider: 'local',
    maxTokens: 32768,
    contextWindow: 32768,
    costPer1M: 0, // Self-hosted
    capabilities: {
      chat: true,
      streaming: true
    },
    status: 'active'
  }
];

/**
 * Helper functions for registry access
 */
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id);
}

export function getModelsByProvider(provider: ModelProvider): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider);
}

export function getModelsByType(type: ModelType): AIModel[] {
  return AI_MODELS.filter(m => m.type === type);
}

export function getActiveModels(): AIModel[] {
  return AI_MODELS.filter(m => m.status === 'active');
}

export function getTotalModels(): number {
  return AI_MODELS.length;
}

/**
 * Get total parameter count for open models only
 */
export function getTotalOpenParams(): number {
  return AI_MODELS
    .filter(m => m.type !== 'closed' && m.paramsB !== null)
    .reduce((sum, m) => sum + (m.paramsB || 0), 0);
}

/**
 * Get MoE models
 */
export function getMoEModels(): AIModel[] {
  return AI_MODELS.filter(m => m.type === 'moe');
}

/**
 * Get Dense models
 */
export function getDenseModels(): AIModel[] {
  return AI_MODELS.filter(m => m.type === 'dense');
}

/**
 * Get Closed/Proprietary models
 */
export function getClosedModels(): AIModel[] {
  return AI_MODELS.filter(m => m.type === 'closed');
}
