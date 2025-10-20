import Anthropic from '@anthropic-ai/sdk';
import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIModelInfo,
  AdapterConfig,
} from './types';

export class AnthropicAdapter implements AIAdapter {
  public readonly name = 'anthropic';
  private client: Anthropic;
  private costMap: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
    'claude-3-opus-20240229': { input: 15, output: 75 },
    'claude-3-sonnet-20240229': { input: 3, output: 15 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  };

  constructor(config: AdapterConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    // Separate system messages
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const response = await this.client.messages.create({
      model: request.model || 'claude-3-5-haiku-20241022',
      max_tokens: request.maxTokens || 4096,
      messages,
      system: systemMessage || undefined,
      temperature: request.temperature ?? 0.7,
      tools: request.tools as any,
    });

    const latencyMs = Date.now() - startTime;
    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    const costConfig = this.costMap[response.model] || this.costMap['claude-3-5-haiku-20241022'];
    const cost =
      (response.usage.input_tokens / 1000) * costConfig.input +
      (response.usage.output_tokens / 1000) * costConfig.output;

    return {
      id: response.id,
      content: textContent,
      model: response.model,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      latencyMs,
      cost,
      finishReason: this.mapStopReason(response.stop_reason),
      toolCalls: response.content
        .filter((c: any) => c.type === 'tool_use')
        .map((tc: any) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input),
          },
        })),
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk> {
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const stream = await this.client.messages.stream({
      model: request.model || 'claude-3-5-haiku-20241022',
      max_tokens: request.maxTokens || 4096,
      messages,
      system: systemMessage || undefined,
      temperature: request.temperature ?? 0.7,
      tools: request.tools as any,
    });

    let id = '';
    for await (const event of stream) {
      if (event.type === 'message_start') {
        id = event.message.id;
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield {
            id,
            delta: event.delta.text,
            done: false,
          };
        }
      } else if (event.type === 'message_delta') {
        yield {
          id,
          delta: '',
          done: true,
          tokensIn: (event as any).usage?.input_tokens,
          tokensOut: (event as any).usage?.output_tokens,
        };
      }
    }
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        costPer1kIn: 3,
        costPer1kOut: 15,
        capabilities: ['text', 'code', 'vision', 'reasoning'],
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        contextWindow: 200000,
        costPer1kIn: 0.8,
        costPer1kOut: 4,
        capabilities: ['text', 'code', 'vision'],
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        costPer1kIn: 15,
        costPer1kOut: 75,
        capabilities: ['text', 'code', 'vision', 'reasoning'],
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        contextWindow: 200000,
        costPer1kIn: 3,
        costPer1kOut: 15,
        capabilities: ['text', 'code', 'vision'],
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        contextWindow: 200000,
        costPer1kIn: 0.25,
        costPer1kOut: 1.25,
        capabilities: ['text', 'code'],
      },
    ];
  }

  private mapStopReason(reason: string | null): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}
