/**
 * Map-Reduce Runner - Token Governor Phase F
 * Parallel processing for large medical documents
 * Load balancing across multiple models and workers
 */

const { safeChunk } = require('../extractors/safeChunk');
const { ResumeEngine } = require('../checkpoints/resumeEngine');
const { TokenBucketManager } = require('../governor/tokenBucket');
const EventEmitter = require('events');

class MapReduceRunner extends EventEmitter {
    constructor(options = {}) {
        super();

        this.jobId = options.jobId || `mapreduce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.workers = options.workers || 5; // Parallel worker count
        this.models = options.models || ['claude-sonnet-4-5']; // Models to use
        this.priority = options.priority || 'P1_user';
        this.chunkOptions = options.chunkOptions || { targetTokens: 6000, overlapTokens: 350 };

        this.resumeEngine = null;
        this.tokenBucketManager = null;

        this.results = [];
        this.errors = [];
        this.startTime = null;
        this.endTime = null;

        this.stats = {
            totalChunks: 0,
            processedChunks: 0,
            failedChunks: 0,
            totalTokensInput: 0,
            totalTokensOutput: 0,
            parallelism: this.workers,
            models: this.models
        };
    }

    /**
     * Initialize map-reduce job
     */
    async initialize() {
        this.resumeEngine = new ResumeEngine({
            jobId: this.jobId,
            model: this.models[0],
            priority: this.priority
        });

        await this.resumeEngine.initialize();

        this.tokenBucketManager = new TokenBucketManager();
        await this.tokenBucketManager.initialize();

        console.log(`[MapReduce] Initialized job ${this.jobId} with ${this.workers} workers`);

        return this;
    }

    /**
     * Map phase: Shard document into chunks and process in parallel
     */
    async map(document, mapFn) {
        this.startTime = Date.now();

        // Phase 1: Chunk document using semantic boundaries
        const chunks = safeChunk(document, this.chunkOptions);
        this.stats.totalChunks = chunks.length;

        console.log(`[MapReduce] Sharded document into ${chunks.length} chunks`);

        // Phase 2: Add chunks to resume engine
        for (const chunk of chunks) {
            this.resumeEngine.addChunk(chunk);
            this.stats.totalTokensInput += chunk.tokens;
        }

        // Phase 3: Get pending chunks (resume support)
        const pendingChunks = this.resumeEngine.getPendingChunks();
        console.log(`[MapReduce] Processing ${pendingChunks.length} pending chunks (${chunks.length - pendingChunks.length} already completed)`);

        // Phase 4: Process chunks in parallel with load balancing
        const workerPromises = [];

        for (let i = 0; i < this.workers; i++) {
            const workerPromise = this.processWorker(i, pendingChunks, mapFn);
            workerPromises.push(workerPromise);
        }

        await Promise.allSettled(workerPromises);

        console.log(`[MapReduce] Map phase complete: ${this.stats.processedChunks}/${this.stats.totalChunks} chunks processed`);

        return this.results;
    }

    /**
     * Worker: Process assigned chunks
     */
    async processWorker(workerId, chunks, mapFn) {
        const chunkBatch = chunks.filter((_, index) => index % this.workers === workerId);

        console.log(`[MapReduce] Worker ${workerId} assigned ${chunkBatch.length} chunks`);

        for (const chunk of chunkBatch) {
            try {
                // Select model (round-robin load balancing)
                const model = this.models[chunk.id % this.models.length];

                // Request tokens from bucket
                const tokenRequest = await this.tokenBucketManager.request(
                    model,
                    chunk.tokens,
                    this.priority
                );

                if (!tokenRequest.granted) {
                    console.warn(`[MapReduce] Worker ${workerId}: Waiting ${tokenRequest.waitMs}ms for tokens (chunk ${chunk.id})`);
                    await this.sleep(tokenRequest.waitMs);

                    // Retry token request
                    const retryRequest = await this.tokenBucketManager.request(model, chunk.tokens, this.priority);
                    if (!retryRequest.granted) {
                        throw new Error('Token bucket exhausted after retry');
                    }
                }

                // Execute map function
                const mapResult = await mapFn(chunk, { model, workerId });

                // Track output tokens
                const outputTokens = mapResult.outputTokens || Math.ceil(JSON.stringify(mapResult).length / 3.5);
                this.stats.totalTokensOutput += outputTokens;

                // Store result
                this.results.push({
                    chunkId: chunk.id,
                    workerId,
                    model,
                    result: mapResult,
                    outputTokens,
                    processingTimeMs: mapResult.processingTimeMs || 0
                });

                // Mark chunk as processed in resume engine
                await this.resumeEngine.markProcessed(chunk.id, {
                    outputTokens,
                    processingTimeMs: mapResult.processingTimeMs || 0
                });

                this.stats.processedChunks++;

                this.emit('chunk:processed', {
                    chunkId: chunk.id,
                    workerId,
                    model,
                    progress: (this.stats.processedChunks / this.stats.totalChunks * 100).toFixed(2)
                });

            } catch (error) {
                console.error(`[MapReduce] Worker ${workerId}: Failed to process chunk ${chunk.id}:`, error);

                this.errors.push({
                    chunkId: chunk.id,
                    workerId,
                    error: error.message
                });

                await this.resumeEngine.markFailed(chunk.id, error);
                this.stats.failedChunks++;

                this.emit('chunk:failed', {
                    chunkId: chunk.id,
                    workerId,
                    error: error.message
                });
            }
        }

        console.log(`[MapReduce] Worker ${workerId} completed ${chunkBatch.length} chunks`);
    }

    /**
     * Reduce phase: Aggregate results from map phase
     */
    async reduce(reduceFn) {
        console.log(`[MapReduce] Starting reduce phase with ${this.results.length} results`);

        // Sort results by chunkId to maintain order
        const sortedResults = this.results.sort((a, b) => a.chunkId - b.chunkId);

        // Execute reduce function
        const finalResult = await reduceFn(sortedResults);

        this.endTime = Date.now();

        console.log(`[MapReduce] Reduce phase complete`);

        return finalResult;
    }

    /**
     * Execute full map-reduce job
     */
    async run(document, mapFn, reduceFn) {
        await this.initialize();

        const mapResults = await this.map(document, mapFn);
        const finalResult = await this.reduce(reduceFn);

        await this.resumeEngine.complete();

        const summary = this.getSummary();

        this.emit('job:complete', summary);

        return {
            result: finalResult,
            summary
        };
    }

    /**
     * Get job summary
     */
    getSummary() {
        const duration = this.endTime - this.startTime;

        return {
            jobId: this.jobId,
            status: this.stats.failedChunks > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
            totalChunks: this.stats.totalChunks,
            processedChunks: this.stats.processedChunks,
            failedChunks: this.stats.failedChunks,
            totalTokensInput: this.stats.totalTokensInput,
            totalTokensOutput: this.stats.totalTokensOutput,
            durationMs: duration,
            throughput: {
                chunksPerSecond: (this.stats.processedChunks / (duration / 1000)).toFixed(2),
                tokensPerSecond: (this.stats.totalTokensOutput / (duration / 1000)).toFixed(2)
            },
            workers: this.workers,
            models: this.models,
            errors: this.errors,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Medical Report Aggregator (Reduce Function Example)
 */
function medicalReportAggregator(results) {
    const sections = results.map(r => r.result.text || r.result).join('\n\n---\n\n');

    const aggregated = {
        fullReport: sections,
        metadata: {
            totalSections: results.length,
            models: [...new Set(results.map(r => r.model))],
            totalOutputTokens: results.reduce((sum, r) => sum + r.outputTokens, 0),
            processingTimeMs: results.reduce((sum, r) => sum + (r.processingTimeMs || 0), 0)
        }
    };

    return aggregated;
}

/**
 * Multi-Model Consensus Aggregator (Reduce Function)
 * Aggregates results from multiple models for same chunk (ensemble)
 */
function consensusAggregator(results) {
    // Group by chunkId
    const grouped = results.reduce((acc, r) => {
        if (!acc[r.chunkId]) acc[r.chunkId] = [];
        acc[r.chunkId].push(r);
        return acc;
    }, {});

    const consensus = Object.entries(grouped).map(([chunkId, chunkResults]) => {
        // Extract predictions from each model
        const predictions = chunkResults.map(r => r.result.prediction || r.result);

        // Simple majority vote
        const counts = {};
        predictions.forEach(p => {
            const key = JSON.stringify(p);
            counts[key] = (counts[key] || 0) + 1;
        });

        const majority = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            chunkId: parseInt(chunkId),
            consensusPrediction: JSON.parse(majority[0]),
            confidence: majority[1] / predictions.length,
            modelCount: chunkResults.length,
            models: chunkResults.map(r => r.model)
        };
    });

    return {
        consensusResults: consensus,
        metadata: {
            totalChunks: Object.keys(grouped).length,
            modelsUsed: [...new Set(results.map(r => r.model))],
            avgConfidence: (consensus.reduce((sum, c) => sum + c.confidence, 0) / consensus.length).toFixed(2)
        }
    };
}

/**
 * Load Balancer: Distribute chunks across models
 */
class ModelLoadBalancer {
    constructor(models) {
        this.models = models;
        this.currentIndex = 0;
        this.usage = models.reduce((acc, model) => {
            acc[model] = 0;
            return acc;
        }, {});
    }

    /**
     * Get next model (round-robin)
     */
    getNextModel() {
        const model = this.models[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.models.length;
        this.usage[model]++;
        return model;
    }

    /**
     * Get least-used model
     */
    getLeastUsedModel() {
        const sorted = Object.entries(this.usage).sort((a, b) => a[1] - b[1]);
        const model = sorted[0][0];
        this.usage[model]++;
        return model;
    }

    /**
     * Get usage statistics
     */
    getUsageStats() {
        return {
            models: this.models,
            usage: this.usage,
            total: Object.values(this.usage).reduce((sum, count) => sum + count, 0)
        };
    }
}

module.exports = {
    MapReduceRunner,
    medicalReportAggregator,
    consensusAggregator,
    ModelLoadBalancer
};
