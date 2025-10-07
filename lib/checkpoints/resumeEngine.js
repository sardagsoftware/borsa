/**
 * Checkpoint & Resume Engine - Token Governor Phase D
 * JSONL-based idempotent processing with SHA-256 hash validation
 * Enables resume from exact chunk position after failure/timeout
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const readline = require('readline');
const { createReadStream, createWriteStream } = require('fs');

const tokenBudget = require('../../configs/token-budget.json');

class ResumeEngine {
    constructor(options = {}) {
        this.jobId = options.jobId || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.storagePath = options.storagePath || tokenBudget.checkpointing.storage_path || './ops/checkpoints';
        this.checkpointInterval = options.checkpointInterval || tokenBudget.checkpointing.interval_chunks || 10;
        this.hashAlgorithm = options.hashAlgorithm || tokenBudget.checkpointing.hash_algorithm || 'sha256';

        this.checkpointFile = path.join(this.storagePath, `${this.jobId}.jsonl`);
        this.metadataFile = path.join(this.storagePath, `${this.jobId}.meta.json`);

        this.chunks = [];
        this.processedChunks = new Set();
        this.checkpointCounter = 0;
        this.lastCheckpointTime = Date.now();

        this.metadata = {
            jobId: this.jobId,
            status: 'INITIALIZED',
            totalChunks: 0,
            processedChunks: 0,
            failedChunks: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            model: options.model || 'claude-sonnet-4-5',
            priority: options.priority || 'P1_user',
            resumable: true
        };
    }

    /**
     * Initialize checkpoint storage
     */
    async initialize() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });

            // Check if checkpoint exists (resume scenario)
            const checkpointExists = await this.fileExists(this.checkpointFile);
            const metadataExists = await this.fileExists(this.metadataFile);

            if (checkpointExists && metadataExists) {
                // Resume from checkpoint
                await this.loadCheckpoint();
                this.metadata.status = 'RESUMED';
                console.log(`[ResumeEngine] Resuming job ${this.jobId} from checkpoint (${this.processedChunks.size} chunks already processed)`);
            } else {
                // New job
                this.metadata.status = 'RUNNING';
                await this.saveMetadata();
                console.log(`[ResumeEngine] Initialized new job ${this.jobId}`);
            }

            return this;
        } catch (error) {
            console.error('[ResumeEngine] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Add chunk for processing
     */
    addChunk(chunkData) {
        const chunkId = chunkData.id || this.chunks.length;
        const hash = this.computeHash(chunkData.text || chunkData.content);

        const chunk = {
            id: chunkId,
            hash,
            text: chunkData.text || chunkData.content,
            tokens: chunkData.tokens,
            type: chunkData.type || 'text',
            start: chunkData.start,
            end: chunkData.end,
            overlap: chunkData.overlap || false,
            addedAt: new Date().toISOString()
        };

        this.chunks.push(chunk);
        this.metadata.totalChunks++;

        return chunk;
    }

    /**
     * Compute SHA-256 hash for chunk integrity
     */
    computeHash(content) {
        return crypto
            .createHash(this.hashAlgorithm)
            .update(content)
            .digest('hex');
    }

    /**
     * Mark chunk as processed
     */
    async markProcessed(chunkId, result = {}) {
        const chunk = this.chunks.find(c => c.id === chunkId);
        if (!chunk) {
            throw new Error(`Chunk ${chunkId} not found`);
        }

        this.processedChunks.add(chunkId);
        this.metadata.processedChunks++;
        this.metadata.updatedAt = new Date().toISOString();
        this.checkpointCounter++;

        const checkpointEntry = {
            chunkId,
            hash: chunk.hash,
            status: 'COMPLETED',
            result: {
                outputTokens: result.outputTokens || 0,
                processingTimeMs: result.processingTimeMs || 0,
                model: this.metadata.model
            },
            processedAt: new Date().toISOString()
        };

        // Append to JSONL checkpoint file
        await this.appendCheckpoint(checkpointEntry);

        // Save metadata every N chunks
        if (this.checkpointCounter >= this.checkpointInterval) {
            await this.saveMetadata();
            this.checkpointCounter = 0;
            this.lastCheckpointTime = Date.now();
        }

        return checkpointEntry;
    }

    /**
     * Mark chunk as failed
     */
    async markFailed(chunkId, error) {
        const chunk = this.chunks.find(c => c.id === chunkId);
        if (!chunk) {
            throw new Error(`Chunk ${chunkId} not found`);
        }

        this.metadata.failedChunks++;
        this.metadata.updatedAt = new Date().toISOString();

        const checkpointEntry = {
            chunkId,
            hash: chunk.hash,
            status: 'FAILED',
            error: {
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            failedAt: new Date().toISOString()
        };

        await this.appendCheckpoint(checkpointEntry);
        await this.saveMetadata();

        return checkpointEntry;
    }

    /**
     * Append checkpoint entry to JSONL file (idempotent)
     */
    async appendCheckpoint(entry) {
        try {
            const jsonlLine = JSON.stringify(entry) + '\n';
            await fs.appendFile(this.checkpointFile, jsonlLine);
        } catch (error) {
            console.error('[ResumeEngine] Failed to append checkpoint:', error);
            throw error;
        }
    }

    /**
     * Load checkpoint from JSONL file
     */
    async loadCheckpoint() {
        const fileStream = createReadStream(this.checkpointFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (line.trim()) {
                const entry = JSON.parse(line);

                if (entry.status === 'COMPLETED') {
                    this.processedChunks.add(entry.chunkId);
                }
            }
        }

        // Load metadata
        const metadataContent = await fs.readFile(this.metadataFile, 'utf-8');
        this.metadata = JSON.parse(metadataContent);

        console.log(`[ResumeEngine] Loaded checkpoint: ${this.processedChunks.size} chunks processed`);
    }

    /**
     * Save metadata to JSON file
     */
    async saveMetadata() {
        try {
            const metadataJson = JSON.stringify(this.metadata, null, 2);
            await fs.writeFile(this.metadataFile, metadataJson);
        } catch (error) {
            console.error('[ResumeEngine] Failed to save metadata:', error);
            throw error;
        }
    }

    /**
     * Get pending chunks (not yet processed)
     */
    getPendingChunks() {
        return this.chunks.filter(chunk => !this.processedChunks.has(chunk.id));
    }

    /**
     * Get processed chunk count
     */
    getProcessedCount() {
        return this.processedChunks.size;
    }

    /**
     * Get completion percentage
     */
    getCompletionPercentage() {
        if (this.metadata.totalChunks === 0) return 0;
        return (this.metadata.processedChunks / this.metadata.totalChunks * 100).toFixed(2);
    }

    /**
     * Verify chunk integrity using hash
     */
    verifyChunkIntegrity(chunkId, expectedHash) {
        const chunk = this.chunks.find(c => c.id === chunkId);
        if (!chunk) {
            return { valid: false, reason: 'CHUNK_NOT_FOUND' };
        }

        const actualHash = this.computeHash(chunk.text);

        if (actualHash !== expectedHash) {
            return {
                valid: false,
                reason: 'HASH_MISMATCH',
                expected: expectedHash,
                actual: actualHash
            };
        }

        return { valid: true };
    }

    /**
     * Get job status
     */
    getStatus() {
        return {
            jobId: this.jobId,
            status: this.metadata.status,
            totalChunks: this.metadata.totalChunks,
            processedChunks: this.metadata.processedChunks,
            failedChunks: this.metadata.failedChunks,
            pendingChunks: this.chunks.length - this.processedChunks.size,
            completionPct: this.getCompletionPercentage(),
            createdAt: this.metadata.createdAt,
            updatedAt: this.metadata.updatedAt,
            checkpointFile: this.checkpointFile,
            metadataFile: this.metadataFile,
            resumable: this.metadata.resumable
        };
    }

    /**
     * Mark job as completed
     */
    async complete() {
        this.metadata.status = 'COMPLETED';
        this.metadata.completedAt = new Date().toISOString();
        this.metadata.updatedAt = new Date().toISOString();
        await this.saveMetadata();

        console.log(`[ResumeEngine] Job ${this.jobId} completed: ${this.metadata.processedChunks}/${this.metadata.totalChunks} chunks processed`);

        return this.getStatus();
    }

    /**
     * Mark job as failed
     */
    async fail(reason) {
        this.metadata.status = 'FAILED';
        this.metadata.failureReason = reason;
        this.metadata.failedAt = new Date().toISOString();
        this.metadata.updatedAt = new Date().toISOString();
        await this.saveMetadata();

        console.error(`[ResumeEngine] Job ${this.jobId} failed: ${reason}`);

        return this.getStatus();
    }

    /**
     * Cleanup checkpoint files (optional, after successful completion)
     */
    async cleanup() {
        try {
            await fs.unlink(this.checkpointFile);
            await fs.unlink(this.metadataFile);
            console.log(`[ResumeEngine] Cleaned up checkpoint files for job ${this.jobId}`);
        } catch (error) {
            console.warn('[ResumeEngine] Cleanup failed (files may not exist):', error.message);
        }
    }
}

/**
 * Resume Engine Manager
 * Manages multiple jobs and provides recovery mechanisms
 */
class ResumeEngineManager {
    constructor(options = {}) {
        this.storagePath = options.storagePath || './ops/checkpoints';
        this.engines = new Map();
    }

    /**
     * Create or resume a job
     */
    async getEngine(jobId, options = {}) {
        if (this.engines.has(jobId)) {
            return this.engines.get(jobId);
        }

        const engine = new ResumeEngine({
            jobId,
            storagePath: this.storagePath,
            ...options
        });

        await engine.initialize();
        this.engines.set(jobId, engine);

        return engine;
    }

    /**
     * Remove engine (job completed or cleaned up)
     */
    removeEngine(jobId) {
        this.engines.delete(jobId);
    }

    /**
     * List all jobs
     */
    async listJobs() {
        const files = await fs.readdir(this.storagePath);
        const metadataFiles = files.filter(f => f.endsWith('.meta.json'));

        const jobs = [];
        for (const metaFile of metadataFiles) {
            const metadataPath = path.join(this.storagePath, metaFile);
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            jobs.push(metadata);
        }

        return jobs;
    }

    /**
     * Find resumable jobs (RUNNING or FAILED status)
     */
    async findResumableJobs() {
        const allJobs = await this.listJobs();
        return allJobs.filter(job => ['RUNNING', 'FAILED'].includes(job.status));
    }

    /**
     * Auto-resume all resumable jobs
     */
    async autoResume() {
        const resumableJobs = await this.findResumableJobs();
        console.log(`[ResumeEngineManager] Found ${resumableJobs.length} resumable jobs`);

        const resumed = [];
        for (const job of resumableJobs) {
            try {
                const engine = await this.getEngine(job.jobId);
                resumed.push(engine.getStatus());
            } catch (error) {
                console.error(`[ResumeEngineManager] Failed to resume job ${job.jobId}:`, error);
            }
        }

        return resumed;
    }
}

module.exports = {
    ResumeEngine,
    ResumeEngineManager
};
