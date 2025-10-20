/**
 * Semantic Cache using SimHash
 *
 * Caches AI responses based on semantic similarity, not exact match
 * Uses SimHash for fast approximate matching
 */

export interface CacheEntry {
  queryHash: string;
  query: string;
  response: string;
  embedding?: number[];
  hits: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number;
  similarityThreshold?: number;
}

export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600, // 1 hour default
      maxSize: options.maxSize || 10000,
      similarityThreshold: options.similarityThreshold || 0.95,
    };
  }

  /**
   * Get cached response if semantically similar query exists
   */
  async get(query: string, embedding?: number[]): Promise<string | null> {
    const queryHash = this.simHash(query);

    // Exact hash match
    const exactMatch = this.cache.get(queryHash);
    if (exactMatch && !this.isExpired(exactMatch)) {
      exactMatch.hits++;
      return exactMatch.response;
    }

    // Semantic similarity search (if embedding provided)
    if (embedding) {
      const similarEntry = this.findSimilar(embedding);
      if (similarEntry && !this.isExpired(similarEntry)) {
        similarEntry.hits++;
        return similarEntry.response;
      }
    }

    return null;
  }

  /**
   * Store response in cache
   */
  async set(query: string, response: string, embedding?: number[]): Promise<void> {
    const queryHash = this.simHash(query);

    // Evict old entries if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      queryHash,
      query,
      response,
      embedding,
      hits: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.options.ttl * 1000),
    };

    this.cache.set(queryHash, entry);
  }

  /**
   * SimHash implementation for text
   */
  private simHash(text: string): string {
    const words = text.toLowerCase().split(/\s+/);
    const hashSize = 64;
    const v = new Array(hashSize).fill(0);

    for (const word of words) {
      const hash = this.stringHash(word);

      for (let i = 0; i < hashSize; i++) {
        const bit = (hash >> i) & 1;
        v[i] += bit ? 1 : -1;
      }
    }

    // Convert to binary string
    let simhash = '';
    for (let i = 0; i < hashSize; i++) {
      simhash += v[i] > 0 ? '1' : '0';
    }

    return simhash;
  }

  /**
   * Simple string hash function
   */
  private stringHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Find similar entry using cosine similarity
   */
  private findSimilar(embedding: number[]): CacheEntry | null {
    let bestMatch: CacheEntry | null = null;
    let bestScore = 0;

    for (const entry of this.cache.values()) {
      if (!entry.embedding) continue;

      const similarity = this.cosineSimilarity(embedding, entry.embedding);

      if (similarity > bestScore && similarity >= this.options.similarityThreshold) {
        bestScore = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return entry.expiresAt < new Date();
  }

  /**
   * Evict least recently used (by hits)
   */
  private evictLRU(): void {
    let minHits = Infinity;
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.cache) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        keyToEvict = key;
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    totalHits: number;
    avgHitsPerEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      totalHits,
      avgHitsPerEntry: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    };
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let cleared = 0;
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }
}
