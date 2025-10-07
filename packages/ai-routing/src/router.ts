import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from '@ailydian/ai-adapters';

export interface RoutingStrategy {
  selectAdapter(
    adapters: AIAdapter[],
    request: AICompletionRequest,
    context: RoutingContext
  ): Promise<AIAdapter>;
}

export interface RoutingContext {
  userId?: string;
  intent?: string;
  budgetRemaining?: number;
  latencyTarget?: number;
  qualityTarget?: number;
}

export class CostOptimizedStrategy implements RoutingStrategy {
  async selectAdapter(
    adapters: AIAdapter[],
    request: AICompletionRequest,
    context: RoutingContext
  ): Promise<AIAdapter> {
    // Simple cost optimization: prefer cheaper models for basic tasks
    const openai = adapters.find(a => a.name === 'openai');
    if (!openai) throw new Error('No OpenAI adapter available');

    // Default to gpt-4o-mini for cost optimization
    if (!request.model) {
      request.model = 'gpt-4o-mini';
    }

    return openai;
  }
}

export class LatencyOptimizedStrategy implements RoutingStrategy {
  async selectAdapter(
    adapters: AIAdapter[],
    request: AICompletionRequest,
    context: RoutingContext
  ): Promise<AIAdapter> {
    // Prefer faster models like gpt-3.5-turbo or gpt-4o-mini
    const openai = adapters.find(a => a.name === 'openai');
    if (!openai) throw new Error('No OpenAI adapter available');

    if (!request.model) {
      request.model = 'gpt-3.5-turbo';
    }

    return openai;
  }
}

export class QualityOptimizedStrategy implements RoutingStrategy {
  async selectAdapter(
    adapters: AIAdapter[],
    request: AICompletionRequest,
    context: RoutingContext
  ): Promise<AIAdapter> {
    // Prefer highest quality models
    const openai = adapters.find(a => a.name === 'openai');
    if (!openai) throw new Error('No OpenAI adapter available');

    if (!request.model) {
      request.model = 'gpt-4o';
    }

    return openai;
  }
}

export class AIRouter {
  private adapters: Map<string, AIAdapter> = new Map();
  private strategy: RoutingStrategy;
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();

  constructor(strategy: RoutingStrategy = new CostOptimizedStrategy()) {
    this.strategy = strategy;
  }

  registerAdapter(adapter: AIAdapter): void {
    this.adapters.set(adapter.name, adapter);
    this.circuitBreaker.set(adapter.name, {
      failures: 0,
      lastFailure: 0,
      state: 'closed',
    });
  }

  setStrategy(strategy: RoutingStrategy): void {
    this.strategy = strategy;
  }

  async complete(
    request: AICompletionRequest,
    context: RoutingContext = {}
  ): Promise<AICompletionResponse> {
    const adapter = await this.strategy.selectAdapter(
      Array.from(this.adapters.values()),
      request,
      context
    );

    // Check circuit breaker
    const breaker = this.circuitBreaker.get(adapter.name)!;
    if (breaker.state === 'open') {
      if (Date.now() - breaker.lastFailure > 60000) {
        // Try half-open after 1 minute
        breaker.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker open for ${adapter.name}`);
      }
    }

    try {
      const response = await adapter.complete(request);

      // Reset circuit breaker on success
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failures = 0;
      }

      return response;
    } catch (error) {
      // Increment failures
      breaker.failures++;
      breaker.lastFailure = Date.now();

      // Open circuit after 5 failures
      if (breaker.failures >= 5) {
        breaker.state = 'open';
      }

      throw error;
    }
  }

  async *stream(
    request: AICompletionRequest,
    context: RoutingContext = {}
  ): AsyncIterableIterator<AIStreamChunk> {
    const adapter = await this.strategy.selectAdapter(
      Array.from(this.adapters.values()),
      request,
      context
    );

    yield* adapter.stream(request);
  }
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}
