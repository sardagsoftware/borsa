/**
 * Output Limiter - Token Governor Phase C
 * Monitors output token count and triggers CONTINUE_JOB queue
 * Prevents context overflow and 429 rate limit errors
 */

const tokenBudget = require('../../configs/token-budget.json');

class OutputLimiter {
    constructor(options = {}) {
        this.model = options.model || 'claude-sonnet-4-5';
        this.modelConfig = tokenBudget.models[this.model];

        if (!this.modelConfig) {
            throw new Error(`Model ${this.model} not found in token-budget.json`);
        }

        this.maxOutputTokens = this.modelConfig.max_out;
        this.safeOutputTokens = this.modelConfig.safe_out;
        this.warningThreshold = Math.floor(this.maxOutputTokens * 0.85); // 85% warning
        this.criticalThreshold = Math.floor(this.maxOutputTokens * 0.90); // 90% CONTINUE_JOB

        this.currentTokens = 0;
        this.warningFired = false;
        this.continuationQueued = false;
        this.sessionId = options.sessionId || null;
        this.priority = options.priority || 'P1_user';

        this.listeners = [];
    }

    /**
     * Register event listener
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    /**
     * Track output tokens
     */
    track(tokenCount) {
        this.currentTokens += tokenCount;

        const utilization = this.currentTokens / this.maxOutputTokens;

        // Warning threshold (85%)
        if (this.currentTokens >= this.warningThreshold && !this.warningFired) {
            this.warningFired = true;
            this.emit('warning', {
                sessionId: this.sessionId,
                currentTokens: this.currentTokens,
                maxTokens: this.maxOutputTokens,
                utilizationPct: (utilization * 100).toFixed(2),
                threshold: 'WARNING_85PCT',
                timestamp: new Date().toISOString()
            });
        }

        // Critical threshold (90%) - Trigger CONTINUE_JOB
        if (this.currentTokens >= this.criticalThreshold && !this.continuationQueued) {
            this.continuationQueued = true;
            this.triggerContinuation();
        }

        // Hard limit check
        if (this.currentTokens >= this.maxOutputTokens) {
            this.emit('limit_exceeded', {
                sessionId: this.sessionId,
                currentTokens: this.currentTokens,
                maxTokens: this.maxOutputTokens,
                utilizationPct: (utilization * 100).toFixed(2),
                action: 'FORCE_STOP',
                timestamp: new Date().toISOString()
            });
            return false; // Stop processing
        }

        return true; // Continue processing
    }

    /**
     * Trigger CONTINUE_JOB queue
     */
    triggerContinuation() {
        const continueJob = {
            jobId: `${this.sessionId}-continue-${Date.now()}`,
            parentSessionId: this.sessionId,
            model: this.model,
            continueFromToken: this.currentTokens,
            priority: this.priority,
            queueName: tokenBudget.streaming.continue_job_queue || 'token-governor-continue',
            trigger: 'OUTPUT_CAP_90PCT',
            timestamp: new Date().toISOString(),
            metadata: {
                parentTokens: this.currentTokens,
                parentMaxTokens: this.maxOutputTokens,
                utilizationPct: (this.currentTokens / this.maxOutputTokens * 100).toFixed(2)
            }
        };

        this.emit('continuation', continueJob);

        console.log(`[OutputLimiter] CONTINUE_JOB queued: ${continueJob.jobId} (${this.currentTokens}/${this.maxOutputTokens} tokens)`);

        return continueJob;
    }

    /**
     * Get current limiter status
     */
    getStatus() {
        const utilization = this.currentTokens / this.maxOutputTokens;
        let status = 'NORMAL';

        if (this.currentTokens >= this.maxOutputTokens) {
            status = 'LIMIT_EXCEEDED';
        } else if (this.currentTokens >= this.criticalThreshold) {
            status = 'CRITICAL';
        } else if (this.currentTokens >= this.warningThreshold) {
            status = 'WARNING';
        }

        return {
            sessionId: this.sessionId,
            model: this.model,
            currentTokens: this.currentTokens,
            maxTokens: this.maxOutputTokens,
            safeTokens: this.safeOutputTokens,
            warningThreshold: this.warningThreshold,
            criticalThreshold: this.criticalThreshold,
            utilizationPct: (utilization * 100).toFixed(2),
            status,
            warningFired: this.warningFired,
            continuationQueued: this.continuationQueued,
            remainingTokens: this.maxOutputTokens - this.currentTokens,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset limiter (for new session)
     */
    reset(sessionId = null) {
        this.currentTokens = 0;
        this.warningFired = false;
        this.continuationQueued = false;
        this.sessionId = sessionId;
    }

    /**
     * Check if safe to continue
     */
    canContinue(additionalTokens = 0) {
        return (this.currentTokens + additionalTokens) < this.maxOutputTokens;
    }

    /**
     * Get remaining token budget
     */
    getRemainingBudget() {
        return Math.max(0, this.maxOutputTokens - this.currentTokens);
    }
}

/**
 * Multi-Model Output Limiter Manager
 * Manages limiters for multiple models in parallel
 */
class OutputLimiterManager {
    constructor() {
        this.limiters = new Map();
        this.globalStats = {
            totalSessions: 0,
            activeSessions: 0,
            continuationsTriggered: 0,
            limitsExceeded: 0
        };
    }

    /**
     * Get or create limiter for session
     */
    getLimiter(sessionId, model, options = {}) {
        if (!this.limiters.has(sessionId)) {
            const limiter = new OutputLimiter({
                sessionId,
                model,
                ...options
            });

            // Track global stats
            limiter.on('continuation', () => {
                this.globalStats.continuationsTriggered++;
            });

            limiter.on('limit_exceeded', () => {
                this.globalStats.limitsExceeded++;
            });

            this.limiters.set(sessionId, limiter);
            this.globalStats.totalSessions++;
            this.globalStats.activeSessions++;
        }

        return this.limiters.get(sessionId);
    }

    /**
     * Remove limiter (session ended)
     */
    removeLimiter(sessionId) {
        if (this.limiters.has(sessionId)) {
            this.limiters.delete(sessionId);
            this.globalStats.activeSessions--;
        }
    }

    /**
     * Get all active sessions
     */
    getActiveSessions() {
        const sessions = [];
        for (const [sessionId, limiter] of this.limiters.entries()) {
            sessions.push(limiter.getStatus());
        }
        return sessions;
    }

    /**
     * Get global statistics
     */
    getGlobalStats() {
        return {
            ...this.globalStats,
            activeSessionDetails: this.getActiveSessions(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset all limiters
     */
    resetAll() {
        this.limiters.clear();
        this.globalStats = {
            totalSessions: 0,
            activeSessions: 0,
            continuationsTriggered: 0,
            limitsExceeded: 0
        };
    }
}

/**
 * Express middleware for automatic output limiting
 */
function outputLimiterMiddleware(options = {}) {
    const manager = options.manager || new OutputLimiterManager();

    return (req, res, next) => {
        const sessionId = req.headers['x-session-id'] || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const model = req.body.model || options.defaultModel || 'claude-sonnet-4-5';
        const priority = req.body.priority || 'P1_user';

        const limiter = manager.getLimiter(sessionId, model, { priority });

        // Attach limiter to request
        req.outputLimiter = limiter;

        // Override res.write to track tokens
        const originalWrite = res.write.bind(res);
        res.write = function(chunk, ...args) {
            if (typeof chunk === 'string') {
                const estimatedTokens = Math.ceil(chunk.length / 3.5);
                const canContinue = limiter.track(estimatedTokens);

                if (!canContinue) {
                    console.warn(`[OutputLimiter] Session ${sessionId} exceeded max output, stopping stream`);
                    res.end();
                    return false;
                }
            }
            return originalWrite(chunk, ...args);
        };

        // Cleanup on response end
        res.on('finish', () => {
            manager.removeLimiter(sessionId);
        });

        next();
    };
}

module.exports = {
    OutputLimiter,
    OutputLimiterManager,
    outputLimiterMiddleware
};
