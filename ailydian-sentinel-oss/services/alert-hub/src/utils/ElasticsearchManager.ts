import { Client } from '@elastic/elasticsearch'
import { logger } from '@/index'

export class ElasticsearchManager {
  private client: Client
  private connected: boolean = false

  constructor() {
    const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    const elasticsearchAuth = process.env.ELASTICSEARCH_AUTH

    const config: any = {
      node: elasticsearchUrl,
      maxRetries: 5,
      requestTimeout: 60000,
      sniffOnStart: false
    }

    // Add authentication if provided
    if (elasticsearchAuth) {
      const [username, password] = elasticsearchAuth.split(':')
      config.auth = { username, password }
    }

    // Handle self-signed certificates in development
    if (process.env.NODE_ENV === 'development') {
      config.ssl = {
        rejectUnauthorized: false
      }
    }

    this.client = new Client(config)
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      const response = await this.client.ping()
      if (response) {
        this.connected = true
        logger.info('✅ Elasticsearch connection established')
        
        // Create default indices
        await this.createDefaultIndices()
      }
    } catch (error) {
      logger.error('❌ Failed to connect to Elasticsearch:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close()
        this.connected = false
        logger.info('🔌 Elasticsearch connection closed')
      }
    } catch (error) {
      logger.error('❌ Error closing Elasticsearch connection:', error)
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  // Document operations
  async index(index: string, id: string, document: any): Promise<any> {
    try {
      const response = await this.client.index({
        index: this.getIndexName(index),
        id,
        body: document,
        refresh: 'wait_for'
      })
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch INDEX error for ${index}:`, error)
      throw error
    }
  }

  async get(index: string, id: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: this.getIndexName(index),
        id
      })
      return response.body
    } catch (error) {
      if (error.statusCode === 404) {
        return null
      }
      logger.error(`❌ Elasticsearch GET error for ${index}/${id}:`, error)
      throw error
    }
  }

  async update(index: string, id: string, document: any): Promise<any> {
    try {
      const response = await this.client.update({
        index: this.getIndexName(index),
        id,
        body: {
          doc: document
        },
        refresh: 'wait_for'
      })
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch UPDATE error for ${index}/${id}:`, error)
      throw error
    }
  }

  async delete(index: string, id: string): Promise<any> {
    try {
      const response = await this.client.delete({
        index: this.getIndexName(index),
        id,
        refresh: 'wait_for'
      })
      return response.body
    } catch (error) {
      if (error.statusCode === 404) {
        return null
      }
      logger.error(`❌ Elasticsearch DELETE error for ${index}/${id}:`, error)
      throw error
    }
  }

  // Search operations
  async search(index: string, query: any): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.getIndexName(index),
        body: query
      })
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch SEARCH error for ${index}:`, error)
      throw error
    }
  }

  async count(index: string, query?: any): Promise<any> {
    try {
      const params: any = {
        index: this.getIndexName(index)
      }
      
      if (query) {
        params.body = query
      }

      const response = await this.client.count(params)
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch COUNT error for ${index}:`, error)
      throw error
    }
  }

  async deleteByQuery(index: string, query: any): Promise<any> {
    try {
      const response = await this.client.deleteByQuery({
        index: this.getIndexName(index),
        body: query,
        refresh: true
      })
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch DELETE_BY_QUERY error for ${index}:`, error)
      throw error
    }
  }

  // Bulk operations
  async bulk(operations: any[]): Promise<any> {
    try {
      const body = operations.flatMap(op => {
        if (op.index) {
          op.index.index = this.getIndexName(op.index.index)
        }
        return op
      })

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for'
      })
      return response.body
    } catch (error) {
      logger.error('❌ Elasticsearch BULK error:', error)
      throw error
    }
  }

  // Index management
  async createIndex(index: string, mapping?: any): Promise<any> {
    try {
      const indexName = this.getIndexName(index)
      
      // Check if index already exists
      const exists = await this.client.indices.exists({ index: indexName })
      if (exists.body) {
        logger.debug(`🗂️ Index ${indexName} already exists`)
        return
      }

      const params: any = { index: indexName }
      if (mapping) {
        params.body = { mappings: mapping }
      }

      const response = await this.client.indices.create(params)
      logger.info(`✅ Created Elasticsearch index: ${indexName}`)
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch CREATE_INDEX error for ${index}:`, error)
      throw error
    }
  }

  async deleteIndex(index: string): Promise<any> {
    try {
      const indexName = this.getIndexName(index)
      const response = await this.client.indices.delete({ index: indexName })
      logger.warn(`⚠️ Deleted Elasticsearch index: ${indexName}`)
      return response.body
    } catch (error) {
      if (error.statusCode === 404) {
        return null
      }
      logger.error(`❌ Elasticsearch DELETE_INDEX error for ${index}:`, error)
      throw error
    }
  }

  async putMapping(index: string, mapping: any): Promise<any> {
    try {
      const response = await this.client.indices.putMapping({
        index: this.getIndexName(index),
        body: mapping
      })
      return response.body
    } catch (error) {
      logger.error(`❌ Elasticsearch PUT_MAPPING error for ${index}:`, error)
      throw error
    }
  }

  // Create default indices with proper mappings
  private async createDefaultIndices(): Promise<void> {
    const indices = [
      {
        name: 'security-alerts',
        mapping: {
          properties: {
            id: { type: 'keyword' },
            timestamp: { type: 'date' },
            source: { type: 'keyword' },
            severity: { type: 'keyword' },
            category: { type: 'keyword' },
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            status: { type: 'keyword' },
            src_ip: { type: 'ip' },
            dst_ip: { type: 'ip' },
            src_port: { type: 'integer' },
            dst_port: { type: 'integer' },
            protocol: { type: 'keyword' },
            hostname: { type: 'keyword' },
            user: { type: 'keyword' },
            process_name: { type: 'keyword' },
            command_line: { type: 'text' },
            file_path: { type: 'keyword' },
            file_hash: { type: 'keyword' },
            registry_key: { type: 'keyword' },
            risk_score: { type: 'float' },
            false_positive_probability: { type: 'float' },
            escalation_level: { type: 'integer' },
            tags: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
            'mitre.tactic': { type: 'keyword' },
            'mitre.technique': { type: 'keyword' },
            'mitre.confidence': { type: 'float' }
          }
        }
      },
      {
        name: 'alert-correlations',
        mapping: {
          properties: {
            id: { type: 'keyword' },
            alerts: { type: 'keyword' },
            correlation_type: { type: 'keyword' },
            correlation_value: { type: 'keyword' },
            confidence: { type: 'float' },
            incident_id: { type: 'keyword' },
            created_at: { type: 'date' }
          }
        }
      },
      {
        name: 'security-incidents',
        mapping: {
          properties: {
            incident_id: { type: 'keyword' },
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            severity: { type: 'keyword' },
            status: { type: 'keyword' },
            related_alerts: { type: 'keyword' },
            assignee: { type: 'keyword' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' }
          }
        }
      }
    ]

    for (const index of indices) {
      try {
        await this.createIndex(index.name, index.mapping)
      } catch (error) {
        logger.error(`❌ Failed to create index ${index.name}:`, error)
      }
    }
  }

  // Helper methods
  private getIndexName(index: string): string {
    const prefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'ailydian'
    return `${prefix}-${index}`
  }

  // Health and info
  async getClusterHealth(): Promise<any> {
    try {
      const response = await this.client.cluster.health()
      return response.body
    } catch (error) {
      logger.error('❌ Elasticsearch CLUSTER_HEALTH error:', error)
      throw error
    }
  }

  async getClusterStats(): Promise<any> {
    try {
      const response = await this.client.cluster.stats()
      return response.body
    } catch (error) {
      logger.error('❌ Elasticsearch CLUSTER_STATS error:', error)
      throw error
    }
  }

  getClient(): Client {
    return this.client
  }
}