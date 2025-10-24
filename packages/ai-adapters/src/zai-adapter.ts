/**
 * Z.AI Adapter (GLM-4.6 / GLM-4.5v)
 * Code-focused and multimodal models from Zhipu's global Z.AI endpoint.
 */

import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from './types';
import { getZaiModels } from './zai-adapter-models';

type ZaiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ZaiChatResponse = {
  id: string;
  model: string;
  choices: Array<{
    message?: { content?: string };
    finish_reason?: string | null;
    delta?: { content?: string };
  }>;
  usage?: ZaiUsage;
};

export class ZaiAdapter implements AIAdapter {
  readonly name = 'z-ai';
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.z.ai/api/paas/v4') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startedAt = Date.now();
    const body = this.buildRequestBody(request, false);
    const response = await this.sendRequest(body);
    const latencyMs = Date.now() - startedAt;

    const usage = response.usage ?? {};
    const choice = response.choices?.[0];
    const content = choice?.message?.content ?? '';
    const finishReason = choice?.finish_reason ?? 'stop';
    const cost = this.calculateCost(request.model, usage);

    return {
      id: response.id,
      content,
      model: response.model,
      tokensIn: usage.prompt_tokens ?? 0,
      tokensOut: usage.completion_tokens ?? 0,
      latencyMs,
      cost,
      finishReason: (finishReason ?? 'stop') as AICompletionResponse['finishReason'],
    };
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncIterableIterator<AIStreamChunk> {
    const body = this.buildRequestBody(request, true);
    const response = await this.sendStreamRequest(body);
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('Z.AI stream failed: missing response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const payload = line.slice(6);
        if (payload === '[DONE]') {
          return;
        }

        try {
          const parsed: ZaiChatResponse = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          const finishReason = parsed.choices?.[0]?.finish_reason;

          if (delta) {
            yield {
              id: parsed.id,
              delta,
              done: false,
            };
          }

          if (finishReason && finishReason !== 'null') {
            yield {
              id: parsed.id,
              delta: '',
              done: true,
            };
            return;
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    }
  }

  async getAvailableModels() {
    return getZaiModels();
  }

  private buildRequestBody(
    request: AICompletionRequest,
    stream: boolean
  ): Record<string, unknown> {
    return {
      model: request.model ?? 'glm-4.6',
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream,
    };
  }

  private async sendRequest(
    body: Record<string, unknown>
  ): Promise<ZaiChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Z.AI request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as ZaiChatResponse;
  }

  private async sendStreamRequest(body: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Z.AI stream failed (${response.status}): ${text}`);
    }

    return response;
  }

  private calculateCost(model: string | undefined, usage: ZaiUsage): number {
    const map: Record<string, { input: number; output: number }> = {
      'glm-4.6': { input: 0.003, output: 0.003 },
      'glm-4.5v': { input: 0.002, output: 0.002 },
    };
    const key = model ?? 'glm-4.6';
    const pricing = map[key] ?? map['glm-4.6'];

    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;

    return (
      (promptTokens / 1000) * pricing.input +
      (completionTokens / 1000) * pricing.output
    );
  }
}
