import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIModelInfo,
  AdapterConfig,
} from './types';

export class MistralAdapter implements AIAdapter {
  public readonly name = 'mistral';
  private apiKey: string;
  private baseUrl: string;
  private costMap: Record<string, { input: number; output: number }> = {
    'mistral-large-latest': { input: 2, output: 6 },
    'mistral-medium-latest': { input: 2.5, output: 7.5 },
    'mistral-small-latest': { input: 0.2, output: 0.6 },
    'codestral-latest': { input: 0.2, output: 0.6 },
    'open-mistral-nemo': { input: 0.15, output: 0.15 },
    'open-mistral-7b': { input: 0.25, output: 0.25 },
  };

  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.mistral.ai/v1';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    const model = request.model || 'mistral-small-latest';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
        tools: request.tools,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${await response.text()}`);
    }

    const data: any = await response.json();
    const latencyMs = Date.now() - startTime;

    const choice = data.choices[0];
    const usage = data.usage;

    const costConfig = this.costMap[model] || this.costMap['mistral-small-latest'];
    const cost =
      (usage.prompt_tokens / 1000) * costConfig.input +
      (usage.completion_tokens / 1000) * costConfig.output;

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      tokensIn: usage.prompt_tokens,
      tokensOut: usage.completion_tokens,
      latencyMs,
      cost,
      finishReason: this.mapFinishReason(choice.finish_reason),
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk> {
    const model = request.model || 'mistral-small-latest';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
        tools: request.tools,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';

            yield {
              id: parsed.id,
              delta,
              done: parsed.choices[0]?.finish_reason !== null,
              tokensIn: parsed.usage?.prompt_tokens,
              tokensOut: parsed.usage?.completion_tokens,
            };
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    return [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        contextWindow: 128000,
        costPer1kIn: 2,
        costPer1kOut: 6,
        capabilities: ['text', 'code', 'reasoning'],
      },
      {
        id: 'mistral-medium-latest',
        name: 'Mistral Medium',
        contextWindow: 32000,
        costPer1kIn: 2.5,
        costPer1kOut: 7.5,
        capabilities: ['text', 'code'],
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small',
        contextWindow: 32000,
        costPer1kIn: 0.2,
        costPer1kOut: 0.6,
        capabilities: ['text', 'code'],
      },
      {
        id: 'codestral-latest',
        name: 'Codestral',
        contextWindow: 32000,
        costPer1kIn: 0.2,
        costPer1kOut: 0.6,
        capabilities: ['code'],
      },
      {
        id: 'open-mistral-nemo',
        name: 'Mistral Nemo (Open)',
        contextWindow: 128000,
        costPer1kIn: 0.15,
        costPer1kOut: 0.15,
        capabilities: ['text', 'code'],
      },
      {
        id: 'open-mistral-7b',
        name: 'Mistral 7B (Open)',
        contextWindow: 32000,
        costPer1kIn: 0.25,
        costPer1kOut: 0.25,
        capabilities: ['text'],
      },
    ];
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'model_length':
        return 'length';
      default:
        return 'stop';
    }
  }
}
