/**
 * RAG Context Compressor - Token Governor Phase G
 * Top-k chunk selection with semantic similarity scoring
 * Memory budget optimization to fit within context limits
 */

const { estimateTokens } = require('../extractors/safeChunk');
const tokenBudget = require('../../configs/token-budget.json');

class ContextCompressor {
    constructor(options = {}) {
        this.model = options.model || 'claude-sonnet-4-5';
        this.modelConfig = tokenBudget.models[this.model];
        this.safeContextTokens = this.modelConfig.safe_ctx;
        this.reservedOutputTokens = this.modelConfig.safe_out;

        // Available tokens for context (input - reserved for output)
        this.availableContextTokens = this.safeContextTokens - this.reservedOutputTokens;

        this.topK = options.topK || 10; // Top-k most relevant chunks
        this.similarityThreshold = options.similarityThreshold || 0.5; // Min similarity score
        this.compressionRatio = options.compressionRatio || 0.7; // Target 70% compression
    }

    /**
     * Compress context to fit within token budget
     * Returns top-k most relevant chunks
     */
    compress(query, chunks, options = {}) {
        const maxTokens = options.maxTokens || this.availableContextTokens;

        // Phase 1: Score chunks by relevance to query
        const scoredChunks = chunks.map(chunk => ({
            ...chunk,
            score: this.computeSimilarity(query, chunk.text)
        }));

        // Phase 2: Filter by similarity threshold
        const relevantChunks = scoredChunks.filter(c => c.score >= this.similarityThreshold);

        // Phase 3: Sort by score (descending)
        const sorted = relevantChunks.sort((a, b) => b.score - a.score);

        // Phase 4: Select top-k chunks that fit within budget
        const selected = [];
        let totalTokens = 0;

        for (const chunk of sorted) {
            if (selected.length >= this.topK) break;

            const chunkTokens = chunk.tokens || estimateTokens(chunk.text);

            if (totalTokens + chunkTokens <= maxTokens) {
                selected.push(chunk);
                totalTokens += chunkTokens;
            }
        }

        // Phase 5: Sort selected chunks by original order (maintain coherence)
        const orderedSelection = selected.sort((a, b) => a.id - b.id);

        return {
            selectedChunks: orderedSelection,
            totalChunks: chunks.length,
            selectedCount: orderedSelection.length,
            totalTokens,
            compressionRatio: (totalTokens / chunks.reduce((sum, c) => sum + (c.tokens || estimateTokens(c.text)), 0)).toFixed(2),
            avgRelevanceScore: (selected.reduce((sum, c) => sum + c.score, 0) / selected.length).toFixed(2),
            droppedChunks: chunks.length - orderedSelection.length
        };
    }

    /**
     * Compute semantic similarity between query and chunk
     * Simple TF-IDF-like scoring (production would use embeddings)
     */
    computeSimilarity(query, text) {
        const queryTokens = this.tokenize(query.toLowerCase());
        const textTokens = this.tokenize(text.toLowerCase());

        // Create frequency maps
        const queryFreq = this.frequencyMap(queryTokens);
        const textFreq = this.frequencyMap(textTokens);

        // Compute cosine similarity
        let dotProduct = 0;
        let queryMagnitude = 0;
        let textMagnitude = 0;

        const allTerms = new Set([...Object.keys(queryFreq), ...Object.keys(textFreq)]);

        for (const term of allTerms) {
            const qFreq = queryFreq[term] || 0;
            const tFreq = textFreq[term] || 0;

            dotProduct += qFreq * tFreq;
            queryMagnitude += qFreq * qFreq;
            textMagnitude += tFreq * tFreq;
        }

        if (queryMagnitude === 0 || textMagnitude === 0) return 0;

        const similarity = dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(textMagnitude));

        return similarity;
    }

    /**
     * Tokenize text into words
     */
    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/) // Split on whitespace
            .filter(token => token.length > 2); // Remove short tokens
    }

    /**
     * Create frequency map
     */
    frequencyMap(tokens) {
        const freq = {};
        for (const token of tokens) {
            freq[token] = (freq[token] || 0) + 1;
        }
        return freq;
    }

    /**
     * Aggressive compression: Extract only key sentences
     */
    aggressiveCompress(query, chunks, targetTokens) {
        const compressed = [];
        let totalTokens = 0;

        for (const chunk of chunks) {
            const sentences = this.extractSentences(chunk.text);
            const scoredSentences = sentences.map(sentence => ({
                sentence,
                score: this.computeSimilarity(query, sentence),
                tokens: estimateTokens(sentence)
            }));

            // Sort by relevance
            const relevantSentences = scoredSentences
                .filter(s => s.score >= this.similarityThreshold)
                .sort((a, b) => b.score - a.score);

            // Add sentences until budget reached
            for (const { sentence, tokens } of relevantSentences) {
                if (totalTokens + tokens > targetTokens) break;

                compressed.push(sentence);
                totalTokens += tokens;
            }

            if (totalTokens >= targetTokens) break;
        }

        return {
            compressedText: compressed.join(' '),
            totalTokens,
            originalTokens: chunks.reduce((sum, c) => sum + (c.tokens || estimateTokens(c.text)), 0),
            compressionRatio: (totalTokens / chunks.reduce((sum, c) => sum + (c.tokens || estimateTokens(c.text)), 0)).toFixed(2)
        };
    }

    /**
     * Extract sentences from text
     */
    extractSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Get memory budget status
     */
    getMemoryBudget(contextTokens) {
        return {
            model: this.model,
            safeContextTokens: this.safeContextTokens,
            reservedOutputTokens: this.reservedOutputTokens,
            availableContextTokens: this.availableContextTokens,
            currentContextTokens: contextTokens,
            utilizationPct: (contextTokens / this.availableContextTokens * 100).toFixed(2),
            remainingTokens: this.availableContextTokens - contextTokens,
            canAccommodate: contextTokens <= this.availableContextTokens
        };
    }
}

/**
 * RAG Memory Manager
 * Manages context window budget for RAG systems
 */
class RAGMemoryManager {
    constructor(options = {}) {
        this.model = options.model || 'claude-sonnet-4-5';
        this.compressor = new ContextCompressor({ model: this.model });
        this.conversationHistory = [];
        this.systemPromptTokens = options.systemPromptTokens || 500;
    }

    /**
     * Add user message to conversation
     */
    addUserMessage(message) {
        const tokens = estimateTokens(message);
        this.conversationHistory.push({
            role: 'user',
            content: message,
            tokens,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Add assistant message to conversation
     */
    addAssistantMessage(message) {
        const tokens = estimateTokens(message);
        this.conversationHistory.push({
            role: 'assistant',
            content: message,
            tokens,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get optimized context for next request
     */
    getOptimizedContext(query, knowledgeChunks) {
        // Calculate conversation history tokens
        const historyTokens = this.conversationHistory.reduce((sum, msg) => sum + msg.tokens, 0);

        // Calculate available tokens for knowledge base
        const availableForKB = this.compressor.availableContextTokens - this.systemPromptTokens - historyTokens;

        if (availableForKB <= 0) {
            // Conversation history too long, trim it
            this.trimHistory(this.compressor.availableContextTokens * 0.3); // Reserve 30% for history
            return this.getOptimizedContext(query, knowledgeChunks); // Retry
        }

        // Compress knowledge base chunks
        const compressed = this.compressor.compress(query, knowledgeChunks, {
            maxTokens: availableForKB
        });

        return {
            systemPrompt: {
                tokens: this.systemPromptTokens
            },
            conversationHistory: this.conversationHistory,
            knowledgeBase: compressed.selectedChunks,
            memoryBudget: {
                systemPromptTokens: this.systemPromptTokens,
                historyTokens,
                knowledgeBaseTokens: compressed.totalTokens,
                totalInputTokens: this.systemPromptTokens + historyTokens + compressed.totalTokens,
                availableContextTokens: this.compressor.availableContextTokens,
                utilizationPct: ((this.systemPromptTokens + historyTokens + compressed.totalTokens) / this.compressor.availableContextTokens * 100).toFixed(2)
            }
        };
    }

    /**
     * Trim conversation history to fit within token budget
     */
    trimHistory(maxTokens) {
        let totalTokens = 0;
        const trimmed = [];

        // Keep most recent messages
        for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
            const msg = this.conversationHistory[i];

            if (totalTokens + msg.tokens > maxTokens) break;

            trimmed.unshift(msg);
            totalTokens += msg.tokens;
        }

        const droppedCount = this.conversationHistory.length - trimmed.length;
        if (droppedCount > 0) {
            console.log(`[RAGMemoryManager] Trimmed ${droppedCount} old messages (${totalTokens} tokens retained)`);
        }

        this.conversationHistory = trimmed;
    }

    /**
     * Reset conversation history
     */
    reset() {
        this.conversationHistory = [];
    }

    /**
     * Get memory statistics
     */
    getStats() {
        const historyTokens = this.conversationHistory.reduce((sum, msg) => sum + msg.tokens, 0);

        return {
            model: this.model,
            messageCount: this.conversationHistory.length,
            historyTokens,
            systemPromptTokens: this.systemPromptTokens,
            availableForKnowledgeBase: this.compressor.availableContextTokens - this.systemPromptTokens - historyTokens,
            maxContextTokens: this.compressor.safeContextTokens
        };
    }
}

module.exports = {
    ContextCompressor,
    RAGMemoryManager
};
