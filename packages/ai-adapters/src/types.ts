export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: AITool[];
  userId?: string;
  conversationId?: string;
}

export interface AICompletionResponse {
  id: string;
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  cost: number;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  toolCalls?: AIToolCall[];
}

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface AIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIStreamChunk {
  id: string;
  delta: string;
  done: boolean;
  tokensIn?: number;
  tokensOut?: number;
}

export interface AIAdapter {
  name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  stream(request: AICompletionRequest): AsyncIterableIterator<AIStreamChunk>;
  getAvailableModels(): Promise<AIModelInfo[]>;
}

export interface AIModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  costPer1kIn: number;
  costPer1kOut: number;
  capabilities: string[];
}

export interface AdapterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}
