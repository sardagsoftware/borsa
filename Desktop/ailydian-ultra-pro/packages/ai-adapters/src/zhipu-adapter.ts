/**
 * Zhipu AI Adapter (智谱AI - GLM-4, ChatGLM)
 * Chinese AI provider with GLM series models
 */

import { AIAdapter, AICompletionRequest, AICompletionResponse, AIStreamChunk, AIModelInfo } from './types';
import { getZhipuModels } from './zhipu-adapter-models';

export class ZhipuAdapter implements AIAdapter {
  readonly name = 'zhipu';
  private apiKey: string;
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'glm-4',
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Zhipu API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const latencyMs = Date.now() - startTime;

    const choice = data.choices[0];
    const usage = data.usage || {};

    // Pricing (approximate, CNY converted to USD)
    const costConfig: Record<string, { input: number; output: number }> = {
      'glm-4': { input: 0.015, output: 0.015 }, // ~0.1 CNY per 1K tokens
      'glm-4-air': { input: 0.0015, output: 0.0015 },
      'glm-4-flash': { input: 0.0003, output: 0.0003 },
      chatglm_turbo: { input: 0.0015, output: 0.0015 },
    };

    const config = costConfig[request.model || 'glm-4'] || costConfig['glm-4'];
    const cost =
      (usage.prompt_tokens / 1000) * config.input +
      (usage.completion_tokens / 1000) * config.output;

    return {
      id: data.id,
      content: choice.message.content,
      model: data.model,
      tokensIn: usage.prompt_tokens,
      tokensOut: usage.completion_tokens,
      latencyMs,
      cost,
      finishReason: choice.finish_reason || 'stop',
    };
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncIterableIterator<AIStreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'glm-4',
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Zhipu API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';
            const done = parsed.choices[0]?.finish_reason !== null;

            yield {
              id: parsed.id,
              delta,
              done,
            };

            if (done) return;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    return getZhipuModels();
  }
}
