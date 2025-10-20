import { AIModelInfo } from './types';

export async function getYiModels(): Promise<AIModelInfo[]> {
  return [
    {
      id: 'yi-large',
      name: 'Yi-Large',
      contextWindow: 32768,
      costPer1kIn: 0.003,
      costPer1kOut: 0.003,
      capabilities: ['chat', 'reasoning', 'chinese', 'english'],
    },
    {
      id: 'yi-large-turbo',
      name: 'Yi-Large-Turbo',
      contextWindow: 16384,
      costPer1kIn: 0.0018,
      costPer1kOut: 0.0018,
      capabilities: ['chat', 'fast', 'chinese', 'english'],
    },
    {
      id: 'yi-medium',
      name: 'Yi-Medium',
      contextWindow: 16384,
      costPer1kIn: 0.00045,
      costPer1kOut: 0.00045,
      capabilities: ['chat', 'cost-effective', 'chinese', 'english'],
    },
    {
      id: 'yi-vision',
      name: 'Yi-Vision',
      contextWindow: 4096,
      costPer1kIn: 0.0009,
      costPer1kOut: 0.0009,
      capabilities: ['chat', 'vision', 'multimodal', 'chinese'],
    },
    {
      id: 'yi-medium-200k',
      name: 'Yi-Medium-200K',
      contextWindow: 200000,
      costPer1kIn: 0.0018,
      costPer1kOut: 0.0018,
      capabilities: ['chat', 'long-context', 'chinese', 'english'],
    },
  ];
}
