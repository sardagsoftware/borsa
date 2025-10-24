/**
 * CONCURRENT REQUEST MANAGER
 * ===========================
 * LyDian OS - AI Request Queue & Throttling System
 *
 * Purpose: Prevent "Too many concurrent requests" errors from Claude API
 *
 * Features:
 * - Maximum 5 concurrent AI requests (Anthropic limit)
 * - Request queuing system
 * - Automatic retry with exponential backoff
 * - Request priority support
 *
 * @author LyDian AI Team
 * @date 2025-01-24
 */

class ConcurrentRequestManager {
    constructor(options = {}) {
        this.maxConcurrent = options.maxConcurrent || 3; // Reduced to 3 for extra safety margin
        this.currentActive = 0;
        this.queue = [];
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 2000; // Increased to 2 seconds

        // Stats
        this.stats = {
            totalRequests: 0,
            queuedRequests: 0,
            retriedRequests: 0,
            failedRequests: 0,
            averageWaitTime: 0
        };
    }

    /**
     * Execute request with concurrent limit control
     *
     * @param {Function} requestFn - Async function to execute
     * @param {Object} options - Request options
     * @returns {Promise} Request result
     */
    async execute(requestFn, options = {}) {
        this.stats.totalRequests++;

        const priority = options.priority || 0;
        const startTime = Date.now();

        // If at capacity, queue the request
        if (this.currentActive >= this.maxConcurrent) {
            this.stats.queuedRequests++;
            await this._enqueue(priority);
        }

        this.currentActive++;

        try {
            // Execute with retry logic
            const result = await this._executeWithRetry(requestFn);

            // Update wait time stats
            const waitTime = Date.now() - startTime;
            this._updateAverageWaitTime(waitTime);

            return result;
        } finally {
            this.currentActive--;
            this._processQueue();
        }
    }

    /**
     * Queue request and wait for slot
     *
     * @param {number} priority - Request priority (higher = more important)
     * @returns {Promise} Resolves when slot is available
     */
    _enqueue(priority) {
        return new Promise((resolve) => {
            this.queue.push({ resolve, priority });
            // Sort by priority (highest first)
            this.queue.sort((a, b) => b.priority - a.priority);
        });
    }

    /**
     * Process next item in queue
     */
    _processQueue() {
        if (this.queue.length > 0 && this.currentActive < this.maxConcurrent) {
            const next = this.queue.shift();
            next.resolve();
        }
    }

    /**
     * Execute request with retry logic
     *
     * @param {Function} requestFn - Async function to execute
     * @param {number} attempt - Current attempt number
     * @returns {Promise} Request result
     */
    async _executeWithRetry(requestFn, attempt = 1) {
        try {
            return await requestFn();
        } catch (error) {
            // Check if it's a concurrent limit error
            const isConcurrentError =
                error.code === 'CONCURRENT_LIMIT_EXCEEDED' ||
                error.message?.includes('concurrent requests') ||
                error.message?.includes('Too many requests');

            if (isConcurrentError && attempt < this.retryAttempts) {
                this.stats.retriedRequests++;

                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await this._sleep(delay);

                return this._executeWithRetry(requestFn, attempt + 1);
            }

            // Max retries reached or different error
            this.stats.failedRequests++;
            throw error;
        }
    }

    /**
     * Sleep utility
     *
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Resolves after delay
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Update average wait time stats
     *
     * @param {number} waitTime - Wait time in ms
     */
    _updateAverageWaitTime(waitTime) {
        const total = this.stats.averageWaitTime * (this.stats.totalRequests - 1) + waitTime;
        this.stats.averageWaitTime = Math.round(total / this.stats.totalRequests);
    }

    /**
     * Get manager statistics
     *
     * @returns {Object} Current stats
     */
    getStats() {
        return {
            ...this.stats,
            currentActive: this.currentActive,
            queueLength: this.queue.length,
            maxConcurrent: this.maxConcurrent,
            successRate: this.stats.totalRequests > 0
                ? ((this.stats.totalRequests - this.stats.failedRequests) / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Express middleware wrapper
     *
     * @param {Function} handler - Route handler
     * @returns {Function} Wrapped handler
     */
    middleware(handler) {
        return async (req, res, next) => {
            try {
                const result = await this.execute(
                    () => handler(req, res),
                    { priority: req.priority || 0 }
                );
                return result;
            } catch (error) {
                next(error);
            }
        };
    }
}

// Export singleton instance
let instance = null;

module.exports = {
    /**
     * Get or create manager instance
     *
     * @param {Object} options - Configuration options
     * @returns {ConcurrentRequestManager} Manager instance
     */
    getConcurrentManager: (options = {}) => {
        if (!instance) {
            instance = new ConcurrentRequestManager(options);
        }
        return instance;
    },

    ConcurrentRequestManager
};
