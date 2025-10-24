import { AIModelInfo } from './types';

export async function getZaiModels(): Promise<AIModelInfo[]> {
  return [
    {
      id: 'glm-4.6',
      name: 'GLM-4.6 Code Expert',
      contextWindow: 200000,
      costPer1kIn: 0.003,
      costPer1kOut: 0.003,
      capabilities: ['code', 'analysis', 'reasoning'],
    },
    {
      id: 'glm-4.5v',
      name: 'GLM-4.5v Vision',
      contextWindow: 8192,
      costPer1kIn: 0.002,
      costPer1kOut: 0.002,
      capabilities: ['vision', 'multimodal', 'analysis'],
    },
  ];
}
