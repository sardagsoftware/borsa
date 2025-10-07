/**
 * 01.AI Adapter (零一万物 - Yi-Large, Yi-Vision)
 * Chinese AI provider with Yi series models
 */

import { AIAdapter, AICompletionRequest, AICompletionResponse, AIStreamChunk, AIModelInfo } from './types';

export class YiAdapter implements AIAdapter {
  readonly name = '01ai';
  private apiKey: string;
  private baseUrl = 'https://api.lingyiwanwu.com/v1';

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
        model: request.model || 'yi-large',
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
      throw new Error(`01.AI API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const latencyMs = Date.now() - startTime;

    const choice = data.choices[0];
    const usage = data.usage || {};

    // Pricing (CNY converted to USD)
    const costConfig: Record<string, { input: number; output: number }> = {
      'yi-large': { input: 0.003, output: 0.003 }, // ~0.02 CNY per 1K tokens
      'yi-large-turbo': { input: 0.0018, output: 0.0018 },
      'yi-medium': { input: 0.00045, output: 0.00045 },
      'yi-vision': { input: 0.0009, output: 0.0009 },
      'yi-medium-200k': { input: 0.0018, output: 0.0018 },
    };

    const config = costConfig[request.model || 'yi-large'] || costConfig['yi-large'];
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
        model: request.model || 'yi-large',
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
      throw new Error(`01.AI API error: ${response.statusText}`);
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
    const { getYiModels } = await import('./yi-adapter-models');
    return getYiModels();
  }
}
