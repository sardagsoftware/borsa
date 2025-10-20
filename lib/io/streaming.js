/**
 * Streaming Output Handler - Token Governor Phase C
 * SSE/WebSocket streaming with partial flush and output cap monitoring
 * Target: Flush every 100ms, trigger CONTINUE_JOB at 90% max_out
 */

const EventEmitter = require('events');

class StreamingOutputHandler extends EventEmitter {
    constructor(options = {}) {
        super();

        this.model = options.model || 'claude-sonnet-4-5';
        this.maxOutputTokens = options.maxOutputTokens || 4096;
        this.safeOutputTokens = Math.floor(this.maxOutputTokens * 0.9); // 90% threshold
        this.flushIntervalMs = options.flushIntervalMs || 100;
        this.continueJobQueue = options.continueJobQueue || 'token-governor-continue';

        this.buffer = '';
        this.totalTokens = 0;
        this.chunkCount = 0;
        this.startTime = Date.now();
        this.lastFlushTime = Date.now();
        this.streamActive = false;
        this.outputCapReached = false;

        this.flushTimer = null;
        this.metrics = {
            flushCount: 0,
            avgFlushLatency: 0,
            maxFlushLatency: 0,
            continuationTriggered: false,
            droppedChunks: 0
        };
    }

    /**
     * Start streaming session
     */
    start(sessionId, requestMetadata = {}) {
        this.sessionId = sessionId;
        this.requestMetadata = requestMetadata;
        this.streamActive = true;
        this.startTime = Date.now();

        // Start automatic flush timer
        this.flushTimer = setInterval(() => {
            if (this.buffer.length > 0) {
                this.flush();
            }
        }, this.flushIntervalMs);

        this.emit('stream:start', {
            sessionId,
            model: this.model,
            maxOutputTokens: this.maxOutputTokens,
            safeThreshold: this.safeOutputTokens,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Add chunk to streaming buffer
     */
    write(chunk, tokenCount = null) {
        if (!this.streamActive) {
            console.warn('[StreamingOutputHandler] Attempted to write to inactive stream');
            this.metrics.droppedChunks++;
            return false;
        }

        // Estimate tokens if not provided (rough approximation)
        const estimatedTokens = tokenCount || Math.ceil(chunk.length / 3.5);

        // Check if we're approaching output cap
        if (this.totalTokens + estimatedTokens >= this.safeOutputTokens && !this.outputCapReached) {
            this.outputCapReached = true;
            this.triggerContinuation();
        }

        // Check if we've exceeded max output (hard limit)
        if (this.totalTokens + estimatedTokens > this.maxOutputTokens) {
            console.warn(`[StreamingOutputHandler] Max output exceeded: ${this.totalTokens + estimatedTokens} > ${this.maxOutputTokens}`);
            this.flush(); // Flush remaining buffer
            this.end('MAX_OUTPUT_EXCEEDED');
            return false;
        }

        this.buffer += chunk;
        this.totalTokens += estimatedTokens;
        this.chunkCount++;

        return true;
    }

    /**
     * Partial flush - send buffered content to client
     */
    flush() {
        if (this.buffer.length === 0) return;

        const flushStart = Date.now();
        const content = this.buffer;
        this.buffer = '';

        // Emit flush event (listeners can send SSE/WebSocket)
        this.emit('stream:chunk', {
            sessionId: this.sessionId,
            content: content,
            tokens: this.totalTokens,
            chunkIndex: this.metrics.flushCount,
            timestamp: new Date().toISOString(),
            outputCapReached: this.outputCapReached
        });

        const flushLatency = Date.now() - flushStart;
        this.metrics.flushCount++;
        this.metrics.avgFlushLatency =
            (this.metrics.avgFlushLatency * (this.metrics.flushCount - 1) + flushLatency) / this.metrics.flushCount;
        this.metrics.maxFlushLatency = Math.max(this.metrics.maxFlushLatency, flushLatency);
        this.lastFlushTime = Date.now();
    }

    /**
     * Trigger CONTINUE_JOB when approaching output cap
     */
    triggerContinuation() {
        this.metrics.continuationTriggered = true;

        const continueJob = {
            jobId: `${this.sessionId}-continue-${Date.now()}`,
            parentSessionId: this.sessionId,
            model: this.model,
            continueFromToken: this.totalTokens,
            requestMetadata: this.requestMetadata,
            queueName: this.continueJobQueue,
            priority: this.requestMetadata.priority || 'P1_user',
            timestamp: new Date().toISOString(),
            reason: 'OUTPUT_CAP_APPROACHING'
        };

        this.emit('stream:continuation', continueJob);

        console.log(`[StreamingOutputHandler] CONTINUE_JOB triggered at ${this.totalTokens}/${this.maxOutputTokens} tokens`);
    }

    /**
     * End streaming session
     */
    end(reason = 'COMPLETE') {
        if (!this.streamActive) return;

        // Final flush
        this.flush();

        // Stop flush timer
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        this.streamActive = false;
        const duration = Date.now() - this.startTime;

        const summary = {
            sessionId: this.sessionId,
            reason,
            totalTokens: this.totalTokens,
            chunkCount: this.chunkCount,
            durationMs: duration,
            metrics: {
                flushCount: this.metrics.flushCount,
                avgFlushLatencyMs: Math.round(this.metrics.avgFlushLatency),
                maxFlushLatencyMs: this.metrics.maxFlushLatency,
                droppedChunks: this.metrics.droppedChunks,
                continuationTriggered: this.metrics.continuationTriggered
            },
            outputCapReached: this.outputCapReached,
            timestamp: new Date().toISOString()
        };

        this.emit('stream:end', summary);

        return summary;
    }

    /**
     * Get current stream statistics
     */
    getStats() {
        return {
            sessionId: this.sessionId,
            model: this.model,
            totalTokens: this.totalTokens,
            maxOutputTokens: this.maxOutputTokens,
            utilizationPct: (this.totalTokens / this.maxOutputTokens * 100).toFixed(2),
            bufferSize: this.buffer.length,
            chunkCount: this.chunkCount,
            metrics: this.metrics,
            streamActive: this.streamActive,
            outputCapReached: this.outputCapReached,
            elapsedMs: Date.now() - this.startTime
        };
    }
}

/**
 * SSE (Server-Sent Events) Wrapper
 */
class SSEStreamer {
    constructor(res, options = {}) {
        this.res = res;
        this.handler = new StreamingOutputHandler(options);

        // Setup SSE headers
        this.res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        });

        // Forward events to SSE
        this.handler.on('stream:start', (data) => {
            this.sendEvent('start', data);
        });

        this.handler.on('stream:chunk', (data) => {
            this.sendEvent('chunk', data);
        });

        this.handler.on('stream:continuation', (data) => {
            this.sendEvent('continuation', data);
        });

        this.handler.on('stream:end', (data) => {
            this.sendEvent('end', data);
            this.res.end();
        });
    }

    sendEvent(eventType, data) {
        this.res.write(`event: ${eventType}\n`);
        this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    start(sessionId, metadata) {
        return this.handler.start(sessionId, metadata);
    }

    write(chunk, tokenCount) {
        return this.handler.write(chunk, tokenCount);
    }

    end(reason) {
        return this.handler.end(reason);
    }

    getStats() {
        return this.handler.getStats();
    }
}

/**
 * WebSocket Wrapper
 */
class WebSocketStreamer {
    constructor(ws, options = {}) {
        this.ws = ws;
        this.handler = new StreamingOutputHandler(options);

        // Forward events to WebSocket
        this.handler.on('stream:start', (data) => {
            this.send('start', data);
        });

        this.handler.on('stream:chunk', (data) => {
            this.send('chunk', data);
        });

        this.handler.on('stream:continuation', (data) => {
            this.send('continuation', data);
        });

        this.handler.on('stream:end', (data) => {
            this.send('end', data);
            if (this.ws.readyState === 1) { // OPEN
                this.ws.close();
            }
        });
    }

    send(eventType, data) {
        if (this.ws.readyState === 1) { // OPEN
            this.ws.send(JSON.stringify({ event: eventType, data }));
        }
    }

    start(sessionId, metadata) {
        return this.handler.start(sessionId, metadata);
    }

    write(chunk, tokenCount) {
        return this.handler.write(chunk, tokenCount);
    }

    end(reason) {
        return this.handler.end(reason);
    }

    getStats() {
        return this.handler.getStats();
    }
}

module.exports = {
    StreamingOutputHandler,
    SSEStreamer,
    WebSocketStreamer
};
