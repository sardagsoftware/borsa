/**
 * Fail-Safe Sentinels - Token Governor Phase H
 * Auto-recovery, circuit breaker, health monitoring
 * Exponential backoff retry with 429/timeout detection
 */

const tokenBudget = require('../../configs/token-budget.json');

class FailSafeSentinel {
    constructor(options = {}) {
        this.model = options.model || 'claude-sonnet-4-5';
        this.modelConfig = tokenBudget.models[this.model];

        this.maxRetries = this.modelConfig.retry_max || 7;
        this.backoffBaseMs = this.modelConfig.backoff_base_ms || 250;
        this.backoffMaxMs = this.modelConfig.backoff_max_ms || 30000;

        this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5; // Failures before opening circuit
        this.circuitBreakerResetMs = options.circuitBreakerResetMs || 60000; // 1 minute

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;

        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            retriedRequests: 0,
            circuitBreakerTrips: 0,
            totalBackoffMs: 0
        };
    }

    /**
     * Execute function with retry logic and circuit breaker
     */
    async execute(fn, context = {}) {
        this.metrics.totalRequests++;

        // Check circuit breaker state
        if (this.state === 'OPEN') {
            const elapsed = Date.now() - this.lastFailureTime;

            if (elapsed < this.circuitBreakerResetMs) {
                throw new Error(`Circuit breaker OPEN for ${this.model} (retry in ${Math.ceil((this.circuitBreakerResetMs - elapsed) / 1000)}s)`);
            } else {
                // Transition to HALF_OPEN (test recovery)
                this.state = 'HALF_OPEN';
                console.log(`[FailSafe] Circuit breaker HALF_OPEN for ${this.model} (testing recovery)`);
            }
        }

        let lastError = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await fn();

                // Success
                this.onSuccess();
                return result;

            } catch (error) {
                lastError = error;

                // Check if retryable
                const shouldRetry = this.shouldRetry(error, attempt);

                if (!shouldRetry) {
                    this.onFailure(error);
                    throw error;
                }

                // Calculate backoff
                const backoffMs = this.calculateBackoff(attempt);
                this.metrics.retriedRequests++;
                this.metrics.totalBackoffMs += backoffMs;

                console.warn(`[FailSafe] Retry ${attempt + 1}/${this.maxRetries} for ${this.model} after ${backoffMs}ms (error: ${error.message})`);

                await this.sleep(backoffMs);
            }
        }

        // Max retries exceeded
        this.onFailure(lastError);
        throw new Error(`Max retries (${this.maxRetries}) exceeded for ${this.model}: ${lastError.message}`);
    }

    /**
     * Check if error is retryable
     */
    shouldRetry(error, attempt) {
        if (attempt >= this.maxRetries) return false;

        const retryableErrors = [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNREFUSED',
            '429', // Rate limit
            '500', // Internal server error
            '502', // Bad gateway
            '503', // Service unavailable
            '504'  // Gateway timeout
        ];

        const errorString = error.message || error.toString();

        return retryableErrors.some(code => errorString.includes(code));
    }

    /**
     * Calculate exponential backoff with jitter
     */
    calculateBackoff(attempt) {
        const baseDelay = this.backoffBaseMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * baseDelay; // ±10% jitter
        const delay = Math.min(baseDelay + jitter, this.backoffMaxMs);
        return Math.floor(delay);
    }

    /**
     * Handle successful request
     */
    onSuccess() {
        this.metrics.successfulRequests++;
        this.successCount++;

        if (this.state === 'HALF_OPEN') {
            // Recovery confirmed
            this.state = 'CLOSED';
            this.failureCount = 0;
            console.log(`[FailSafe] Circuit breaker CLOSED for ${this.model} (recovery confirmed)`);
        }
    }

    /**
     * Handle failed request
     */
    onFailure(error) {
        this.metrics.failedRequests++;
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.circuitBreakerThreshold) {
            this.state = 'OPEN';
            this.metrics.circuitBreakerTrips++;
            console.error(`[FailSafe] Circuit breaker OPEN for ${this.model} (${this.failureCount} consecutive failures)`);
        }
    }

    /**
     * Get sentinel status
     */
    getStatus() {
        return {
            model: this.model,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
            metrics: this.metrics,
            config: {
                maxRetries: this.maxRetries,
                backoffBaseMs: this.backoffBaseMs,
                backoffMaxMs: this.backoffMaxMs,
                circuitBreakerThreshold: this.circuitBreakerThreshold
            }
        };
    }

    /**
     * Reset sentinel state
     */
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Health Monitor
 * Continuous health checks for models
 */
class HealthMonitor {
    constructor(options = {}) {
        this.checkIntervalMs = options.checkIntervalMs || 30000; // 30 seconds
        this.models = options.models || Object.keys(tokenBudget.models);
        this.healthChecks = new Map();
        this.timer = null;
    }

    /**
     * Register health check function for model
     */
    registerHealthCheck(model, checkFn) {
        this.healthChecks.set(model, {
            checkFn,
            lastCheck: null,
            status: 'UNKNOWN',
            consecutiveFailures: 0
        });
    }

    /**
     * Start monitoring
     */
    start() {
        if (this.timer) return;

        this.timer = setInterval(async () => {
            await this.runHealthChecks();
        }, this.checkIntervalMs);

        console.log(`[HealthMonitor] Started (checks every ${this.checkIntervalMs}ms)`);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('[HealthMonitor] Stopped');
        }
    }

    /**
     * Run health checks for all models
     */
    async runHealthChecks() {
        for (const [model, check] of this.healthChecks.entries()) {
            try {
                const healthy = await check.checkFn();

                if (healthy) {
                    check.status = 'HEALTHY';
                    check.consecutiveFailures = 0;
                } else {
                    check.status = 'UNHEALTHY';
                    check.consecutiveFailures++;
                }

                check.lastCheck = new Date().toISOString();

            } catch (error) {
                check.status = 'ERROR';
                check.consecutiveFailures++;
                check.lastCheck = new Date().toISOString();
                console.error(`[HealthMonitor] Health check failed for ${model}:`, error.message);
            }

            // Alert on consecutive failures
            if (check.consecutiveFailures >= 3) {
                console.error(`[HealthMonitor] CRITICAL: ${model} unhealthy for ${check.consecutiveFailures} consecutive checks`);
            }
        }
    }

    /**
     * Get health status for all models
     */
    getHealthStatus() {
        const status = {};

        for (const [model, check] of this.healthChecks.entries()) {
            status[model] = {
                status: check.status,
                lastCheck: check.lastCheck,
                consecutiveFailures: check.consecutiveFailures
            };
        }

        return status;
    }
}

/**
 * Auto-Recovery Manager
 * Automatic recovery from failures
 */
class AutoRecoveryManager {
    constructor(options = {}) {
        this.sentinels = new Map();
        this.healthMonitor = new HealthMonitor(options);
        this.recoveryStrategies = new Map();
    }

    /**
     * Register sentinel for model
     */
    registerSentinel(model, sentinel) {
        this.sentinels.set(model, sentinel);
    }

    /**
     * Register recovery strategy
     */
    registerRecoveryStrategy(model, strategyFn) {
        this.recoveryStrategies.set(model, strategyFn);
    }

    /**
     * Execute request with auto-recovery
     */
    async executeWithRecovery(model, fn) {
        const sentinel = this.sentinels.get(model);

        if (!sentinel) {
            throw new Error(`No sentinel registered for ${model}`);
        }

        try {
            return await sentinel.execute(fn);

        } catch (error) {
            // Attempt recovery
            const recoveryFn = this.recoveryStrategies.get(model);

            if (recoveryFn) {
                console.log(`[AutoRecovery] Attempting recovery for ${model}`);

                try {
                    await recoveryFn(error);
                    // Retry after recovery
                    return await sentinel.execute(fn);

                } catch (recoveryError) {
                    console.error(`[AutoRecovery] Recovery failed for ${model}:`, recoveryError.message);
                    throw error; // Re-throw original error
                }
            }

            throw error;
        }
    }

    /**
     * Get global status
     */
    getGlobalStatus() {
        const sentinelStatus = {};

        for (const [model, sentinel] of this.sentinels.entries()) {
            sentinelStatus[model] = sentinel.getStatus();
        }

        return {
            sentinels: sentinelStatus,
            health: this.healthMonitor.getHealthStatus(),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    FailSafeSentinel,
    HealthMonitor,
    AutoRecoveryManager
};
