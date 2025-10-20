import OpenAI from 'openai';
import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIModelInfo,
  AdapterConfig,
} from './types';

export class OpenAIAdapter implements AIAdapter {
  public readonly name = 'openai';
  private client: OpenAI;
  private costMap: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'o1-preview': { input: 15, output: 60 },
    'o1-mini': { input: 3, output: 12 },
  };

  constructor(config: AdapterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: request.model || 'gpt-4o-mini',
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      })) as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: false,
      tools: request.tools as any,
    });

    const latencyMs = Date.now() - startTime;
    const choice = response.choices[0];
    const usage = response.usage!;

    const costConfig = this.costMap[response.model] || this.costMap['gpt-4o-mini'];
    const cost =
      (usage.prompt_tokens / 1000) * costConfig.input +
      (usage.completion_tokens / 1000) * costConfig.output;

    return {
      id: response.id,
      content: choice.message.content || '',
      model: response.model,
      tokensIn: usage.prompt_tokens,
      tokensOut: usage.completion_tokens,
      latencyMs,
      cost,
      finishReason: this.mapFinishReason(choice.finish_reason),
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '',
        },
      })),
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: request.model || 'gpt-4o-mini',
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name && { name: msg.name }),
      })) as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: true,
      tools: request.tools as any,
    });

    let id = '';
    for await (const chunk of stream) {
      id = chunk.id;
      const delta = chunk.choices[0]?.delta?.content || '';

      yield {
        id,
        delta,
        done: chunk.choices[0]?.finish_reason !== null,
        tokensIn: chunk.usage?.prompt_tokens,
        tokensOut: chunk.usage?.completion_tokens,
      };
    }
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        contextWindow: 128000,
        costPer1kIn: 2.5,
        costPer1kOut: 10,
        capabilities: ['text', 'code', 'vision', 'audio'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        contextWindow: 128000,
        costPer1kIn: 0.15,
        costPer1kOut: 0.6,
        capabilities: ['text', 'code', 'vision'],
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        contextWindow: 128000,
        costPer1kIn: 10,
        costPer1kOut: 30,
        capabilities: ['text', 'code', 'vision'],
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        contextWindow: 16385,
        costPer1kIn: 0.5,
        costPer1kOut: 1.5,
        capabilities: ['text', 'code'],
      },
      {
        id: 'o1-preview',
        name: 'O1 Preview',
        contextWindow: 128000,
        costPer1kIn: 15,
        costPer1kOut: 60,
        capabilities: ['text', 'code', 'reasoning'],
      },
      {
        id: 'o1-mini',
        name: 'O1 Mini',
        contextWindow: 128000,
        costPer1kIn: 3,
        costPer1kOut: 12,
        capabilities: ['text', 'code', 'reasoning'],
      },
    ];
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
