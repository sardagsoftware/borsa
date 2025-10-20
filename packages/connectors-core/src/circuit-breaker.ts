// ========================================
// CIRCUIT BREAKER - AUTO-HEALING
// Prevents cascading failures
// White-Hat: Resilience & graceful degradation
// ========================================

import type { CircuitState, CircuitBreakerConfig } from './types';

/**
 * Circuit Breaker
 * Implements circuit breaker pattern for fault tolerance
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private openedAt: number = 0;
  private failureTimestamps: number[] = [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000,        // 60 seconds
      successThreshold: 2,
      monitoringPeriod: 10000,    // 10 seconds
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'open') {
      const now = Date.now();
      const elapsed = now - this.openedAt;

      if (elapsed >= this.config.resetTimeout) {
        console.log(`[CircuitBreaker] ${this.name}: Transitioning to half-open (timeout: ${elapsed}ms)`);
        this.state = 'half_open';
        this.successes = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name} (retry after ${this.config.resetTimeout - elapsed}ms)`);
      }
    }

    // Execute function
    try {
      const result = await fn();

      // Success
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.state === 'half_open') {
      this.successes++;

      if (this.successes >= this.config.successThreshold) {
        console.log(`[CircuitBreaker] ${this.name}: ✅ Circuit closed (successes: ${this.successes})`);
        this.reset();
      }
    } else if (this.state === 'closed') {
      // Decay failures over time
      this.cleanOldFailures();
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);

    // Clean old failures
    this.cleanOldFailures();

    // Check if should open circuit
    if (this.state === 'closed' || this.state === 'half_open') {
      if (this.failures >= this.config.failureThreshold) {
        console.error(`[CircuitBreaker] ${this.name}: ❌ Circuit opened (failures: ${this.failures}/${this.config.failureThreshold})`);
        this.open();
      }
    }
  }

  /**
   * Open circuit
   */
  private open(): void {
    this.state = 'open';
    this.openedAt = Date.now();
  }

  /**
   * Reset circuit
   */
  private reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.failureTimestamps = [];
  }

  /**
   * Clean failures older than monitoring period
   */
  private cleanOldFailures(): void {
    const now = Date.now();
    const cutoff = now - this.config.monitoringPeriod;

    this.failureTimestamps = this.failureTimestamps.filter((ts) => ts > cutoff);
    this.failures = this.failureTimestamps.length;
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get stats
   */
  getStats(): {
    name: string;
    state: CircuitState;
    failures: number;
    successes: number;
    failureThreshold: number;
    successThreshold: number;
    timeSinceOpen?: number;
  } {
    const stats: any = {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      failureThreshold: this.config.failureThreshold,
      successThreshold: this.config.successThreshold,
    };

    if (this.state === 'open') {
      stats.timeSinceOpen = Date.now() - this.openedAt;
    }

    return stats;
  }

  /**
   * Force reset (for testing/manual intervention)
   */
  forceReset(): void {
    console.log(`[CircuitBreaker] ${this.name}: Force reset`);
    this.reset();
  }

  /**
   * Force open (for maintenance)
   */
  forceOpen(): void {
    console.log(`[CircuitBreaker] ${this.name}: Force open`);
    this.open();
  }
}

/**
 * Circuit Breaker Manager
 * Manages circuit breakers for multiple connectors
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Create circuit breaker for a connector
   */
  createBreaker(connectorId: string, config?: CircuitBreakerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker(connectorId, config);
    this.breakers.set(connectorId, breaker);
    console.log(`🔌 Circuit breaker created for: ${connectorId}`);
    return breaker;
  }

  /**
   * Get circuit breaker
   */
  getBreaker(connectorId: string): CircuitBreaker | undefined {
    return this.breakers.get(connectorId);
  }

  /**
   * Execute with circuit breaker protection
   */
  async execute<T>(connectorId: string, fn: () => Promise<T>): Promise<T> {
    let breaker = this.getBreaker(connectorId);

    if (!breaker) {
      // Create default breaker if not exists
      breaker = this.createBreaker(connectorId);
    }

    return await breaker.execute(fn);
  }

  /**
   * Get all stats
   */
  getAllStats(): Array<ReturnType<CircuitBreaker['getStats']>> {
    return Array.from(this.breakers.values()).map((breaker) => breaker.getStats());
  }

  /**
   * Force reset all breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceReset();
    }
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
