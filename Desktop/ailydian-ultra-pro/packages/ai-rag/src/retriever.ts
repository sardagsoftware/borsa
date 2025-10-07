import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedder';

export interface RetrievalRequest {
  query: string;
  topK?: number;
  minScore?: number;
  tenantId?: string;
}

export interface RetrievalResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  metadata?: any;
}

export class RAGRetriever {
  private prisma: PrismaClient;
  private embedder: EmbeddingService;

  constructor(prisma: PrismaClient, embedder: EmbeddingService) {
    this.prisma = prisma;
    this.embedder = embedder;
  }

  /**
   * Retrieve relevant document chunks using vector similarity
   */
  async retrieve(request: RetrievalRequest): Promise<RetrievalResult[]> {
    const { query, topK = 5, minScore = 0.7, tenantId } = request;

    // 1. Generate query embedding
    const { embedding: queryEmbedding } = await this.embedder.embed({ text: query });

    // 2. Vector similarity search using pgvector
    // Note: This requires pgvector extension and proper SQL
    const results = await this.vectorSearch(queryEmbedding, topK, tenantId);

    // 3. Filter by minimum score
    const filtered = results.filter(r => r.score >= minScore);

    // 4. Rerank using cross-encoder (optional, simplified here)
    const reranked = await this.rerank(query, filtered);

    return reranked;
  }

  /**
   * Vector similarity search using raw SQL with pgvector
   */
  private async vectorSearch(
    queryEmbedding: number[],
    topK: number,
    tenantId?: string
  ): Promise<RetrievalResult[]> {
    // Convert embedding to pgvector format
    const vectorStr = `[${queryEmbedding.join(',')}}]`;

    // Raw SQL query with cosine similarity
    const sql = `
      SELECT
        ce.id as "chunkId",
        dc.id as "documentId",
        dc.content,
        d.metadata,
        1 - (ce.embedding <=> $1::vector) as score
      FROM "ChunkEmbedding" ce
      JOIN "DocumentChunk" dc ON ce."chunkId" = dc.id
      JOIN "Document" d ON dc."documentId" = d.id
      ${tenantId ? 'WHERE d."tenantId" = $2' : ''}
      ORDER BY ce.embedding <=> $1::vector
      LIMIT $${tenantId ? '3' : '2'}
    `;

    try {
      const params = tenantId ? [vectorStr, tenantId, topK] : [vectorStr, topK];
      const results: any = await this.prisma.$queryRawUnsafe(sql, ...params);

      return results.map((r: any) => ({
        documentId: r.documentId,
        chunkId: r.chunkId,
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      }));
    } catch (error) {
      console.error('Vector search error:', error);
      // Fallback: return empty results
      return [];
    }
  }

  /**
   * Rerank results using cross-encoder or LLM
   * Simplified: just sorts by score
   */
  private async rerank(
    query: string,
    results: RetrievalResult[]
  ): Promise<RetrievalResult[]> {
    // Advanced: Use cross-encoder model for reranking
    // For now, just return sorted by score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Create grounded answer with citations
   */
  async createGroundedAnswer(
    query: string,
    context: RetrievalResult[]
  ): Promise<{ answer: string; citations: string[] }> {
    // Build context from retrieved chunks
    const contextText = context
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    // Prepare prompt with citations
    const prompt = `Based on the following context, answer the question. Include citation numbers [1], [2], etc.

Context:
${contextText}

Question: ${query}

Answer with citations:`;

    // This would call LLM with the prompt
    // For now, return placeholder
    const citations = context.map((c, i) => `[${i + 1}] Document ${c.documentId}`);

    return {
      answer: 'Answer would be generated here with citations',
      citations,
    };
  }
}
