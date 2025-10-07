/**
 * Token Bucket Algorithm - Token Governor Phase E
 * Distributed TPM (Tokens Per Minute) rate limiting with Redis
 * Priority-based job queue: P0 (clinical) > P1 (user) > P2 (batch)
 */

const RedisAdapter = require('./redis');
const tokenBudget = require('../../configs/token-budget.json');

class TokenBucket {
    constructor(options = {}) {
        this.model = options.model || 'claude-sonnet-4-5';
        this.modelConfig = tokenBudget.models[this.model];

        if (!this.modelConfig) {
            throw new Error(`Model ${this.model} not found in token-budget.json`);
        }

        this.targetTPM = this.modelConfig.target_tpm;
        this.burstTPM = this.modelConfig.burst_tpm;
        this.capacity = this.burstTPM; // Bucket capacity = burst limit
        this.refillRate = this.targetTPM / 60; // Tokens per second
        this.refillInterval = options.refillInterval || tokenBudget.governor.refill_interval_ms || 60000; // 1 minute

        this.redis = options.redis || new RedisAdapter();
        this.bucketKey = `bucket:${this.model}`;
        this.lastRefillKey = `bucket:${this.model}:last-refill`;

        this.priorityQueues = {
            P0_clinical: `queue:${this.model}:P0`,
            P1_user: `queue:${this.model}:P1`,
            P2_batch: `queue:${this.model}:P2`
        };

        this.metrics = {
            totalRequests: 0,
            acceptedRequests: 0,
            rejectedRequests: 0,
            tokensConsumed: 0,
            refillCount: 0,
            queuedJobs: { P0_clinical: 0, P1_user: 0, P2_batch: 0 }
        };
    }

    /**
     * Initialize bucket with full capacity
     */
    async initialize() {
        const exists = await this.redis.exists(this.bucketKey);

        if (!exists) {
            await this.redis.set(this.bucketKey, this.capacity.toString());
            await this.redis.set(this.lastRefillKey, Date.now().toString());
            console.log(`[TokenBucket] Initialized ${this.model} with ${this.capacity} tokens`);
        } else {
            // Trigger refill check on startup
            await this.refill();
        }

        // Start auto-refill timer
        this.startAutoRefill();

        return this;
    }

    /**
     * Request tokens from bucket
     * Returns: { granted: boolean, tokens: number, waitMs?: number }
     */
    async request(tokensNeeded, priority = 'P1_user') {
        this.metrics.totalRequests++;

        // Refill before checking availability
        await this.refill();

        const available = parseInt(await this.redis.get(this.bucketKey) || '0');

        if (available >= tokensNeeded) {
            // Grant tokens immediately
            await this.redis.decrBy(this.bucketKey, tokensNeeded);
            this.metrics.acceptedRequests++;
            this.metrics.tokensConsumed += tokensNeeded;

            return {
                granted: true,
                tokens: tokensNeeded,
                remaining: available - tokensNeeded,
                model: this.model,
                priority
            };
        } else {
            // Queue job for later processing
            this.metrics.rejectedRequests++;
            const waitMs = this.calculateWaitTime(tokensNeeded, available);

            return {
                granted: false,
                tokens: tokensNeeded,
                remaining: available,
                waitMs,
                queuePosition: await this.queueJob({ tokensNeeded, priority }),
                model: this.model,
                priority
            };
        }
    }

    /**
     * Refill bucket based on elapsed time
     */
    async refill() {
        const now = Date.now();
        const lastRefill = parseInt(await this.redis.get(this.lastRefillKey) || now.toString());
        const elapsed = now - lastRefill;

        if (elapsed < 1000) {
            // Less than 1 second elapsed, skip refill
            return 0;
        }

        const elapsedSeconds = elapsed / 1000;
        const tokensToAdd = Math.floor(this.refillRate * elapsedSeconds);

        if (tokensToAdd === 0) return 0;

        const current = parseInt(await this.redis.get(this.bucketKey) || '0');
        const newTokens = Math.min(current + tokensToAdd, this.capacity);

        await this.redis.set(this.bucketKey, newTokens.toString());
        await this.redis.set(this.lastRefillKey, now.toString());

        this.metrics.refillCount++;

        console.log(`[TokenBucket] Refilled ${this.model}: +${tokensToAdd} tokens (${current} → ${newTokens})`);

        return tokensToAdd;
    }

    /**
     * Start automatic refill timer
     */
    startAutoRefill() {
        if (this.refillTimer) {
            clearInterval(this.refillTimer);
        }

        this.refillTimer = setInterval(async () => {
            await this.refill();
            await this.processQueue();
        }, this.refillInterval);

        console.log(`[TokenBucket] Auto-refill started (every ${this.refillInterval}ms)`);
    }

    /**
     * Stop automatic refill timer
     */
    stopAutoRefill() {
        if (this.refillTimer) {
            clearInterval(this.refillTimer);
            this.refillTimer = null;
            console.log('[TokenBucket] Auto-refill stopped');
        }
    }

    /**
     * Calculate estimated wait time for tokens
     */
    calculateWaitTime(tokensNeeded, currentTokens) {
        const tokensShort = tokensNeeded - currentTokens;
        const waitSeconds = tokensShort / this.refillRate;
        return Math.ceil(waitSeconds * 1000); // Convert to milliseconds
    }

    /**
     * Queue job with priority
     */
    async queueJob(job) {
        const priority = job.priority || 'P1_user';
        const queueKey = this.priorityQueues[priority];

        if (!queueKey) {
            throw new Error(`Invalid priority: ${priority}`);
        }

        const jobData = {
            jobId: job.jobId || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            tokensNeeded: job.tokensNeeded,
            priority,
            queuedAt: new Date().toISOString(),
            metadata: job.metadata || {}
        };

        await this.redis.rpush(queueKey, JSON.stringify(jobData));
        this.metrics.queuedJobs[priority]++;

        const queueLength = await this.redis.llen(queueKey);

        console.log(`[TokenBucket] Queued job ${jobData.jobId} (${priority}, position ${queueLength})`);

        return queueLength;
    }

    /**
     * Process queued jobs in priority order
     */
    async processQueue() {
        const priorities = ['P0_clinical', 'P1_user', 'P2_batch'];

        for (const priority of priorities) {
            const queueKey = this.priorityQueues[priority];
            const queueLength = await this.redis.llen(queueKey);

            if (queueLength === 0) continue;

            // Try to process jobs from this priority queue
            let processed = 0;
            const priorityAllocation = this.modelConfig.priority_classes[priority];

            while (processed < 10) { // Limit to 10 jobs per cycle
                const jobJson = await this.redis.lpop(queueKey);
                if (!jobJson) break;

                const job = JSON.parse(jobJson);
                const tokensNeeded = Math.floor(job.tokensNeeded * priorityAllocation);

                const result = await this.request(tokensNeeded, priority);

                if (result.granted) {
                    console.log(`[TokenBucket] Processed queued job ${job.jobId} (${priority})`);
                    processed++;
                    this.metrics.queuedJobs[priority]--;
                } else {
                    // Re-queue job (still not enough tokens)
                    await this.redis.rpush(queueKey, jobJson);
                    break; // Stop processing this priority queue
                }
            }

            if (processed > 0) {
                console.log(`[TokenBucket] Processed ${processed} jobs from ${priority} queue`);
            }
        }
    }

    /**
     * Get current bucket status
     */
    async getStatus() {
        const available = parseInt(await this.redis.get(this.bucketKey) || '0');
        const lastRefill = parseInt(await this.redis.get(this.lastRefillKey) || Date.now().toString());

        const queueLengths = {};
        for (const [priority, queueKey] of Object.entries(this.priorityQueues)) {
            queueLengths[priority] = await this.redis.llen(queueKey);
        }

        return {
            model: this.model,
            capacity: this.capacity,
            available,
            utilizationPct: ((this.capacity - available) / this.capacity * 100).toFixed(2),
            targetTPM: this.targetTPM,
            burstTPM: this.burstTPM,
            refillRate: this.refillRate,
            lastRefill: new Date(lastRefill).toISOString(),
            queueLengths,
            metrics: this.metrics,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset bucket (for testing)
     */
    async reset() {
        await this.redis.set(this.bucketKey, this.capacity.toString());
        await this.redis.set(this.lastRefillKey, Date.now().toString());

        for (const queueKey of Object.values(this.priorityQueues)) {
            await this.redis.del(queueKey);
        }

        this.metrics = {
            totalRequests: 0,
            acceptedRequests: 0,
            rejectedRequests: 0,
            tokensConsumed: 0,
            refillCount: 0,
            queuedJobs: { P0_clinical: 0, P1_user: 0, P2_batch: 0 }
        };

        console.log(`[TokenBucket] Reset ${this.model} bucket`);
    }
}

/**
 * Token Bucket Manager
 * Manages buckets for multiple models
 */
class TokenBucketManager {
    constructor(options = {}) {
        this.redis = options.redis || new RedisAdapter();
        this.buckets = new Map();
        this.monitorInterval = options.monitorInterval || tokenBudget.governor.monitor_interval_ms || 5000;
        this.alert429Threshold = tokenBudget.governor.alert_threshold_429 || 0.05; // 5%
    }

    /**
     * Initialize all model buckets
     */
    async initialize() {
        const models = Object.keys(tokenBudget.models);

        for (const model of models) {
            const bucket = new TokenBucket({
                model,
                redis: this.redis
            });

            await bucket.initialize();
            this.buckets.set(model, bucket);
        }

        // Start monitoring
        this.startMonitoring();

        console.log(`[TokenBucketManager] Initialized ${models.length} model buckets`);

        return this;
    }

    /**
     * Get bucket for model
     */
    getBucket(model) {
        const bucket = this.buckets.get(model);
        if (!bucket) {
            throw new Error(`Model ${model} not initialized`);
        }
        return bucket;
    }

    /**
     * Request tokens for a model
     */
    async request(model, tokensNeeded, priority = 'P1_user') {
        const bucket = this.getBucket(model);
        return await bucket.request(tokensNeeded, priority);
    }

    /**
     * Start monitoring all buckets
     */
    startMonitoring() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
        }

        this.monitorTimer = setInterval(async () => {
            await this.checkHealth();
        }, this.monitorInterval);

        console.log(`[TokenBucketManager] Monitoring started (every ${this.monitorInterval}ms)`);
    }

    /**
     * Check health of all buckets
     */
    async checkHealth() {
        for (const [model, bucket] of this.buckets.entries()) {
            const status = await bucket.getStatus();
            const rejectionRate = status.metrics.totalRequests > 0
                ? status.metrics.rejectedRequests / status.metrics.totalRequests
                : 0;

            if (rejectionRate > this.alert429Threshold) {
                console.warn(`[TokenBucketManager] HIGH REJECTION RATE for ${model}: ${(rejectionRate * 100).toFixed(2)}%`);
            }

            // Check queue buildup
            const totalQueued = Object.values(status.queueLengths).reduce((sum, len) => sum + len, 0);
            if (totalQueued > 100) {
                console.warn(`[TokenBucketManager] QUEUE BUILDUP for ${model}: ${totalQueued} jobs`);
            }
        }
    }

    /**
     * Get status of all buckets
     */
    async getGlobalStatus() {
        const statuses = {};

        for (const [model, bucket] of this.buckets.entries()) {
            statuses[model] = await bucket.getStatus();
        }

        return {
            buckets: statuses,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Stop all buckets
     */
    stop() {
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }

        for (const bucket of this.buckets.values()) {
            bucket.stopAutoRefill();
        }

        console.log('[TokenBucketManager] Stopped all buckets');
    }
}

module.exports = {
    TokenBucket,
    TokenBucketManager
};
