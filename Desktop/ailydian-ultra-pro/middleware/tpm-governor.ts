/**
 * ============================================================================
 * TPM (TOKENS PER MINUTE) GOVERNOR MIDDLEWARE
 * ============================================================================
 * Purpose: Enforce AI provider rate limits during high traffic
 * Features:
 * - Per-provider token counting
 * - Sliding window rate limiting
 * - Automatic queue management
 * - Fair distribution across users
 * White-Hat: Prevent API quota exhaustion, ensure service availability
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';

interface AIProvider {
  name: string;
  tpmLimit: number;        // Tokens per minute limit
  rpmLimit?: number;       // Requests per minute limit
  concurrent?: number;     // Max concurrent requests
}

interface TPMConfig {
  redisUrl: string;
  providers: AIProvider[];
  windowSeconds: number;
  enableQueueing: boolean;
  maxQueueSize: number;
}

interface TPMRequest extends Request {
  estimatedTokens?: number;
  aiProvider?: string;
  queuePosition?: number;
}

class TPMGovernor {
  private redisClient: RedisClientType | null = null;
  private config: TPMConfig;
  private memoryCounters: Map<string, number[]>;
  private queues: Map<string, Array<() => void>>;

  // Default provider limits (based on common tier limits)
  private static readonly DEFAULT_PROVIDERS: AIProvider[] = [
    { name: 'openai-gpt4', tpmLimit: 40000, rpmLimit: 200, concurrent: 10 },
    { name: 'openai-gpt35', tpmLimit: 90000, rpmLimit: 3500, concurrent: 50 },
    { name: 'anthropic-claude', tpmLimit: 100000, rpmLimit: 1000, concurrent: 20 },
    { name: 'groq', tpmLimit: 30000, rpmLimit: 30, concurrent: 5 },
    { name: 'google-gemini', tpmLimit: 32000, rpmLimit: 60, concurrent: 10 }
  ];

  constructor(config: Partial<TPMConfig> = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || '',
      providers: config.providers || TPMGovernor.DEFAULT_PROVIDERS,
      windowSeconds: config.windowSeconds || 60,
      enableQueueing: config.enableQueueing ?? true,
      maxQueueSize: config.maxQueueSize || 1000
    };

    this.memoryCounters = new Map();
    this.queues = new Map();
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redisUrl) {
      console.warn('⚠️  TPM Governor: Redis URL not configured, using memory counters');
      return;
    }

    try {
      this.redisClient = createClient({ url: this.config.redisUrl });

      this.redisClient.on('error', (err) => {
        console.error('❌ TPM Governor Redis error:', err);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ TPM Governor: Redis connected');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('❌ TPM Governor: Failed to connect to Redis:', error);
      this.redisClient = null;
    }
  }

  /**
   * Express middleware function
   */
  public middleware() {
    return async (req: TPMRequest, res: Response, next: NextFunction): Promise<void> => {
      // Extract provider from request
      const provider = this.extractProvider(req);
      if (!provider) {
        return next(); // Not an AI request
      }

      req.aiProvider = provider;

      // Estimate tokens for this request
      const estimatedTokens = this.estimateTokens(req);
      req.estimatedTokens = estimatedTokens;

      // Check if we have capacity
      const hasCapacity = await this.checkCapacity(provider, estimatedTokens);

      if (hasCapacity) {
        // Increment counter
        await this.incrementCounter(provider, estimatedTokens);

        // Allow request to proceed
        return next();
      }

      // No capacity - queue or reject
      if (this.config.enableQueueing) {
        const queued = await this.enqueue(provider, req, res, next);
        if (!queued) {
          this.sendRateLimitResponse(res, provider, 'Queue full');
        }
        // Don't call next() - request is queued
      } else {
        this.sendRateLimitResponse(res, provider, 'Rate limit exceeded');
      }
    };
  }

  /**
   * Extract AI provider from request
   */
  private extractProvider(req: TPMRequest): string | null {
    // Check URL path
    if (req.path.includes('/ai/chat')) {
      const model = req.body?.model || req.query?.model;
      return this.mapModelToProvider(model as string);
    }

    // Check custom header
    const providerHeader = req.headers['x-ai-provider'] as string;
    if (providerHeader) {
      return providerHeader;
    }

    return null;
  }

  /**
   * Map model name to provider
   */
  private mapModelToProvider(model: string | undefined): string | null {
    if (!model) return null;

    const modelLower = model.toLowerCase();

    if (modelLower.includes('gpt-4')) return 'openai-gpt4';
    if (modelLower.includes('gpt-3.5')) return 'openai-gpt35';
    if (modelLower.includes('claude')) return 'anthropic-claude';
    if (modelLower.includes('groq')) return 'groq';
    if (modelLower.includes('gemini')) return 'google-gemini';

    return null;
  }

  /**
   * Estimate tokens for this request
   */
  private estimateTokens(req: TPMRequest): number {
    // If client provides estimate, use it
    const clientEstimate = req.headers['x-estimated-tokens'];
    if (clientEstimate) {
      return parseInt(clientEstimate as string, 10);
    }

    // Estimate based on content
    const content = JSON.stringify(req.body);

    // Rough estimate: 1 token ≈ 4 characters
    const inputTokens = Math.ceil(content.length / 4);

    // Add expected output tokens (default: 500)
    const maxTokens = req.body?.max_tokens || 500;

    return inputTokens + maxTokens;
  }

  /**
   * Check if provider has capacity for this request
   */
  private async checkCapacity(provider: string, tokens: number): Promise<boolean> {
    const providerConfig = this.config.providers.find(p => p.name === provider);
    if (!providerConfig) return true; // Unknown provider, allow

    const currentUsage = await this.getCurrentUsage(provider);
    const wouldExceed = currentUsage + tokens > providerConfig.tpmLimit;

    return !wouldExceed;
  }

  /**
   * Get current token usage for provider
   */
  private async getCurrentUsage(provider: string): Promise<number> {
    const key = `tpm:${provider}`;
    const now = Date.now();
    const windowStart = now - (this.config.windowSeconds * 1000);

    // Try Redis first
    if (this.redisClient) {
      try {
        const entries = await this.redisClient.zRangeByScore(
          key,
          windowStart,
          now
        );

        return entries.reduce((sum, entry) => {
          const [, tokens] = entry.split(':');
          return sum + parseInt(tokens, 10);
        }, 0);
      } catch (error) {
        console.error('❌ TPM Governor: Redis error:', error);
      }
    }

    // Fallback to memory
    const memoryCounters = this.memoryCounters.get(key) || [];
    const validCounters = memoryCounters.filter(ts => ts > windowStart);
    this.memoryCounters.set(key, validCounters);

    return validCounters.length;
  }

  /**
   * Increment token counter for provider
   */
  private async incrementCounter(provider: string, tokens: number): Promise<void> {
    const key = `tpm:${provider}`;
    const now = Date.now();
    const entry = `${now}:${tokens}`;

    // Try Redis first
    if (this.redisClient) {
      try {
        await this.redisClient.zAdd(key, { score: now, value: entry });
        await this.redisClient.expire(key, this.config.windowSeconds * 2);
        return;
      } catch (error) {
        console.error('❌ TPM Governor: Redis increment error:', error);
      }
    }

    // Fallback to memory
    const counters = this.memoryCounters.get(key) || [];
    counters.push(now);
    this.memoryCounters.set(key, counters);
  }

  /**
   * Enqueue request for later processing
   */
  private async enqueue(
    provider: string,
    req: TPMRequest,
    res: Response,
    next: NextFunction
  ): Promise<boolean> {
    const queue = this.queues.get(provider) || [];

    if (queue.length >= this.config.maxQueueSize) {
      return false; // Queue full
    }

    const queuePosition = queue.length + 1;
    req.queuePosition = queuePosition;

    console.log(`⏳ TPM Governor: Queued request for ${provider} (position: ${queuePosition})`);

    return new Promise((resolve) => {
      const processRequest = () => {
        this.incrementCounter(provider, req.estimatedTokens || 0);
        next();
        resolve(true);
      };

      queue.push(processRequest);
      this.queues.set(provider, queue);

      // Process queue periodically
      setTimeout(() => this.processQueue(provider), 1000);
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(provider: string): Promise<void> {
    const queue = this.queues.get(provider) || [];
    if (queue.length === 0) return;

    const hasCapacity = await this.checkCapacity(provider, 1000); // Check for average request
    if (hasCapacity) {
      const processNext = queue.shift();
      if (processNext) {
        processNext();
        this.queues.set(provider, queue);

        console.log(`✅ TPM Governor: Processed queued request for ${provider} (${queue.length} remaining)`);
      }
    }

    // Continue processing
    if (queue.length > 0) {
      setTimeout(() => this.processQueue(provider), 1000);
    }
  }

  /**
   * Send rate limit response
   */
  private sendRateLimitResponse(res: Response, provider: string, reason: string): void {
    const providerConfig = this.config.providers.find(p => p.name === provider);

    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'TPM_LIMIT_EXCEEDED',
      provider,
      reason,
      limit: providerConfig?.tpmLimit,
      retryAfter: this.config.windowSeconds
    });
  }

  /**
   * Get current stats for all providers
   */
  public async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const provider of this.config.providers) {
      const usage = await this.getCurrentUsage(provider.name);
      const queue = this.queues.get(provider.name) || [];

      stats[provider.name] = {
        limit: provider.tpmLimit,
        usage,
        remaining: Math.max(0, provider.tpmLimit - usage),
        utilizationPercent: ((usage / provider.tpmLimit) * 100).toFixed(2),
        queueLength: queue.length
      };
    }

    return stats;
  }

  /**
   * Disconnect Redis client
   */
  public async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Export singleton instance
export const tpmGovernor = new TPMGovernor();

// Export class for custom configurations
export { TPMGovernor };

// Example usage:
// app.post('/api/ai/chat', tpmGovernor.middleware(), handler);
// app.get('/api/ai/stats', async (req, res) => {
//   const stats = await tpmGovernor.getStats();
//   res.json(stats);
// });
