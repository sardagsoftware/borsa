import { LydianClient } from './client';
import { Signal, KnowledgeEntity, KnowledgeQuery, KnowledgeQueryResult, Insight, PaginatedResponse, PaginationParams } from './types';

/**
 * LyDian IQ API client
 */
export class LydianIQClient {
  constructor(private client: LydianClient) {}

  /**
   * Ingest signal into knowledge graph
   */
  async ingestSignal(data: Omit<Signal, 'id' | 'timestamp' | 'processed' | 'processedAt'>): Promise<Signal> {
    return this.client.request<Signal>('POST', '/lydian-iq/signals', { body: data });
  }

  /**
   * Batch ingest signals
   */
  async batchIngestSignals(signals: Array<Omit<Signal, 'id' | 'timestamp' | 'processed' | 'processedAt'>>): Promise<Signal[]> {
    return this.client.request<Signal[]>('POST', '/lydian-iq/signals/batch', { body: { signals } });
  }

  /**
   * Get signal by ID
   */
  async getSignal(signalId: string): Promise<Signal> {
    return this.client.request<Signal>('GET', `/lydian-iq/signals/${signalId}`);
  }

  /**
   * Query knowledge graph
   */
  async queryKnowledge(query: KnowledgeQuery): Promise<KnowledgeQueryResult> {
    return this.client.request<KnowledgeQueryResult>('POST', '/lydian-iq/knowledge/query', { body: query });
  }

  /**
   * Create knowledge entity
   */
  async createEntity(data: Omit<KnowledgeEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntity> {
    return this.client.request<KnowledgeEntity>('POST', '/lydian-iq/knowledge/entities', { body: data });
  }

  /**
   * Get entity by ID
   */
  async getEntity(entityId: string): Promise<KnowledgeEntity> {
    return this.client.request<KnowledgeEntity>('GET', `/lydian-iq/knowledge/entities/${entityId}`);
  }

  /**
   * Update entity
   */
  async updateEntity(entityId: string, data: Partial<KnowledgeEntity>): Promise<KnowledgeEntity> {
    return this.client.request<KnowledgeEntity>('PATCH', `/lydian-iq/knowledge/entities/${entityId}`, { body: data });
  }

  /**
   * Get insights
   */
  async getInsights(params?: PaginationParams & { type?: string; minConfidence?: number }): Promise<PaginatedResponse<Insight>> {
    return this.client.request<PaginatedResponse<Insight>>('GET', '/lydian-iq/insights', {
      query: params,
    });
  }

  /**
   * Get insight by ID
   */
  async getInsight(insightId: string): Promise<Insight> {
    return this.client.request<Insight>('GET', `/lydian-iq/insights/${insightId}`);
  }

  /**
   * Generate insights from query
   */
  async generateInsights(query: string, context?: Record<string, any>): Promise<Insight[]> {
    return this.client.request<Insight[]>('POST', '/lydian-iq/insights/generate', {
      body: { query, context },
    });
  }
}
