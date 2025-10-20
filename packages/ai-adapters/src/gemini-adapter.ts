import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIModelInfo,
  AdapterConfig,
} from './types';

export class GeminiAdapter implements AIAdapter {
  public readonly name = 'gemini';
  private apiKey: string;
  private baseUrl: string;
  private costMap: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash-exp': { input: 0, output: 0 }, // Free tier
    'gemini-1.5-pro': { input: 1.25, output: 5 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 },
    'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
  };

  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const startTime = Date.now();
    const model = request.model || 'gemini-1.5-flash';

    // Convert messages to Gemini format
    const contents = this.convertMessages(request.messages);

    const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens || 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
    }

    const data: any = await response.json();
    const latencyMs = Date.now() - startTime;

    const candidate = data.candidates[0];
    const content = candidate.content.parts[0].text || '';

    const tokensIn = data.usageMetadata?.promptTokenCount || 0;
    const tokensOut = data.usageMetadata?.candidatesTokenCount || 0;

    const costConfig = this.costMap[model] || this.costMap['gemini-1.5-flash'];
    const cost = (tokensIn / 1000) * costConfig.input + (tokensOut / 1000) * costConfig.output;

    return {
      id: `gemini-${Date.now()}`,
      content,
      model,
      tokensIn,
      tokensOut,
      latencyMs,
      cost,
      finishReason: this.mapFinishReason(candidate.finishReason),
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk> {
    const model = request.model || 'gemini-1.5-flash';
    const contents = this.convertMessages(request.messages);

    const response = await fetch(
      `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens || 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const id = `gemini-${Date.now()}`;

    if (!reader) throw new Error('No response body');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          const candidate = data.candidates?.[0];
          if (candidate?.content?.parts?.[0]?.text) {
            yield {
              id,
              delta: candidate.content.parts[0].text,
              done: false,
            };
          }
          if (candidate?.finishReason) {
            yield {
              id,
              delta: '',
              done: true,
              tokensIn: data.usageMetadata?.promptTokenCount,
              tokensOut: data.usageMetadata?.candidatesTokenCount,
            };
          }
        }
      }
    }
  }

  async getAvailableModels(): Promise<AIModelInfo[]> {
    return [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        contextWindow: 1000000,
        costPer1kIn: 0,
        costPer1kOut: 0,
        capabilities: ['text', 'code', 'vision', 'audio'],
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        contextWindow: 2000000,
        costPer1kIn: 1.25,
        costPer1kOut: 5,
        capabilities: ['text', 'code', 'vision', 'audio'],
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1000000,
        costPer1kIn: 0.075,
        costPer1kOut: 0.3,
        capabilities: ['text', 'code', 'vision', 'audio'],
      },
      {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash 8B',
        contextWindow: 1000000,
        costPer1kIn: 0.0375,
        costPer1kOut: 0.15,
        capabilities: ['text', 'code'],
      },
    ];
  }

  private convertMessages(messages: any[]) {
    return messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
