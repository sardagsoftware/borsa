/**
 * Token Governor Middleware Integration
 * Medical AI endpoints with token management, streaming, and fail-safe
 */

const { TokenBucketManager } = require('../governor/tokenBucket');
const { outputLimiterMiddleware } = require('../guardrails/outputLimiter');
const { FailSafeSentinel } = require('../sentinels/failsafe');
const { estimateTokens } = require('../extractors/safeChunk');

// Global instances
let tokenBucketManager = null;
let sentinels = new Map();

/**
 * Initialize Token Governor System
 */
async function initializeTokenGovernor() {
    try {
        // Initialize Token Bucket Manager
        tokenBucketManager = new TokenBucketManager();
        await tokenBucketManager.initialize();

        // Initialize sentinels for each model
        const models = ['AX9F7E2B-sonnet-4-5', 'OX7A3F8D', 'OX7A3F8D', 'GE6D8A4F', 'deepseek-r1'];
        for (const model of models) {
            const sentinel = new FailSafeSentinel({ model });
            sentinels.set(model, sentinel);
        }

        console.log('🎯 [TokenGovernor] System initialized successfully');
        console.log(`   ✅ Token buckets: ${models.length} models`);
        console.log(`   ✅ Fail-safe sentinels: ${sentinels.size} models`);

        return { tokenBucketManager, sentinels };

    } catch (error) {
        console.error('❌ [TokenGovernor] Initialization failed:', error);
        throw error;
    }
}

/**
 * Medical AI Request Middleware
 * Applies token governance before processing
 */
function tokenGovernorMiddleware(options = {}) {
    const defaultModel = options.defaultModel || 'AX9F7E2B-sonnet-4-5';
    const defaultPriority = options.defaultPriority || 'P1_user';

    return async (req, res, next) => {
        const model = req.body.model || req.query.model || defaultModel;
        const priority = req.body.priority || req.query.priority || defaultPriority;

        // Estimate input tokens
        const requestBody = JSON.stringify(req.body);
        const inputTokens = estimateTokens(requestBody);

        // Request tokens from bucket
        try {
            if (!tokenBucketManager) {
                // Fallback if not initialized
                console.warn('[TokenGovernor] Not initialized, allowing request');
                return next();
            }

            const tokenRequest = await tokenBucketManager.request(model, inputTokens, priority);

            if (!tokenRequest.granted) {
                // Tokens not available, queue or reject
                return res.status(429).json({
                    success: false,
                    error: 'Token quota exceeded',
                    waitMs: tokenRequest.waitMs,
                    queuePosition: tokenRequest.queuePosition,
                    model,
                    priority,
                    retryAfter: Math.ceil(tokenRequest.waitMs / 1000),
                    message: `Please retry after ${Math.ceil(tokenRequest.waitMs / 1000)} seconds`
                });
            }

            // Attach token info to request
            req.tokenGovernor = {
                model,
                priority,
                inputTokens,
                granted: tokenRequest.tokens,
                remaining: tokenRequest.remaining
            };

            next();

        } catch (error) {
            console.error('[TokenGovernor] Middleware error:', error);
            // Allow request to proceed on error (fail-open)
            next();
        }
    };
}

/**
 * Sentinel-Protected Request Wrapper
 * Wraps AI API calls with retry and circuit breaker
 */
async function executeWithSentinel(model, fn) {
    const sentinel = sentinels.get(model);

    if (!sentinel) {
        console.warn(`[TokenGovernor] No sentinel for ${model}, executing directly`);
        return await fn();
    }

    return await sentinel.execute(fn);
}

/**
 * Get Token Governor Status
 */
async function getTokenGovernorStatus() {
    if (!tokenBucketManager) {
        return {
            initialized: false,
            error: 'Token Governor not initialized'
        };
    }

    const globalStatus = await tokenBucketManager.getGlobalStatus();
    const sentinelStatus = {};

    for (const [model, sentinel] of sentinels.entries()) {
        sentinelStatus[model] = sentinel.getStatus();
    }

    return {
        initialized: true,
        tokenBuckets: globalStatus,
        sentinels: sentinelStatus,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    initializeTokenGovernor,
    tokenGovernorMiddleware,
    executeWithSentinel,
    getTokenGovernorStatus,
    // Export instances for direct access
    getTokenBucketManager: () => tokenBucketManager,
    getSentinel: (model) => sentinels.get(model)
};
