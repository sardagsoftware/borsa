import { AIModelInfo } from './types';

export async function getZhipuModels(): Promise<AIModelInfo[]> {
  return [
    {
      id: 'glm-4',
      name: 'GLM-4',
      contextWindow: 128000,
      costPer1kIn: 0.015,
      costPer1kOut: 0.015,
      capabilities: ['chat', 'reasoning', 'chinese'],
    },
    {
      id: 'glm-4-air',
      name: 'GLM-4-Air',
      contextWindow: 128000,
      costPer1kIn: 0.0015,
      costPer1kOut: 0.0015,
      capabilities: ['chat', 'fast', 'chinese'],
    },
    {
      id: 'glm-4-flash',
      name: 'GLM-4-Flash',
      contextWindow: 128000,
      costPer1kIn: 0.0003,
      costPer1kOut: 0.0003,
      capabilities: ['chat', 'ultra-fast', 'chinese'],
    },
    {
      id: 'chatglm_turbo',
      name: 'ChatGLM Turbo',
      contextWindow: 8192,
      costPer1kIn: 0.0015,
      costPer1kOut: 0.0015,
      capabilities: ['chat', 'chinese'],
    },
  ];
}
