import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { SecurityAlert, AlertFilter, AlertStats, AlertRule, AlertStatus, AlertSeverity } from '@/types'
import { logger } from '@/index'
import { RedisManager } from '@/utils/RedisManager'
import { ElasticsearchManager } from '@/utils/ElasticsearchManager'

export class AlertHubService extends EventEmitter {
  private redis: RedisManager
  private elasticsearch: ElasticsearchManager
  private alertRules: Map<string, AlertRule> = new Map()

  constructor() {
    super()
    this.redis = new RedisManager()
    this.elasticsearch = new ElasticsearchManager()
  }

  async initialize() {
    logger.info('🚀 Initializing Alert Hub Service...')

    try {
      await this.redis.connect()
      await this.elasticsearch.connect()
      await this.loadAlertRules()

      logger.info('✅ Alert Hub Service initialized successfully')
    } catch (error) {
      logger.error('❌ Failed to initialize Alert Hub Service:', error)
      throw error
    }
  }

  async close() {
    logger.info('🔒 Closing Alert Hub Service connections...')
    await this.redis.disconnect()
    await this.elasticsearch.close()
  }

  /**
   * Process incoming security alert
   */
  async processAlert(rawAlert: any): Promise<SecurityAlert> {
    const alertId = uuidv4()
    const timestamp = new Date().toISOString()

    // Normalize alert data
    const alert: SecurityAlert = {
      id: alertId,
      timestamp: rawAlert.timestamp || timestamp,
      source: rawAlert.source || 'custom',
      severity: rawAlert.severity || 'medium',
      category: rawAlert.category || 'anomaly',
      title: rawAlert.title || 'Security Alert',
      description: rawAlert.description || 'Unknown security event',
      raw_event: rawAlert,
      status: 'open',
      escalation_level: 0,
      created_at: timestamp,
      updated_at: timestamp,
      ...this.extractContextFields(rawAlert)
    }

    try {
      // Apply alert rules and enrichment
      await this.applyAlertRules(alert)

      // Calculate risk score
      alert.risk_score = this.calculateRiskScore(alert)

      // Store alert
      await this.storeAlert(alert)

      // Emit event for real-time notifications
      this.emit('newAlert', alert)

      logger.info(`🚨 Processed alert ${alert.id} (${alert.severity}): ${alert.title}`)

      return alert
    } catch (error) {
      logger.error(`❌ Error processing alert:`, error)
      throw error
    }
  }

  /**
   * Update existing alert
   */
  async updateAlert(alertId: string, updates: Partial<SecurityAlert>): Promise<SecurityAlert> {
    try {
      const existingAlert = await this.getAlert(alertId)
      if (!existingAlert) {
        throw new Error(`Alert ${alertId} not found`)
      }

      const updatedAlert: SecurityAlert = {
        ...existingAlert,
        ...updates,
        updated_at: new Date().toISOString()
      }

      await this.storeAlert(updatedAlert)
      this.emit('alertUpdate', updatedAlert)

      logger.info(`📝 Updated alert ${alertId}`)
      return updatedAlert
    } catch (error) {
      logger.error(`❌ Error updating alert ${alertId}:`, error)
      throw error
    }
  }

  /**
   * Get single alert by ID
   */
  async getAlert(alertId: string): Promise<SecurityAlert | null> {
    try {
      const result = await this.elasticsearch.get('security-alerts', alertId)
      return result?._source || null
    } catch (error) {
      if (error.statusCode === 404) {
        return null
      }
      logger.error(`❌ Error getting alert ${alertId}:`, error)
      throw error
    }
  }

  /**
   * Search and filter alerts
   */
  async searchAlerts(filter: AlertFilter): Promise<{ alerts: SecurityAlert[], total: number }> {
    try {
      const query: any = {
        bool: {
          must: [],
          filter: []
        }
      }

      // Apply filters
      if (filter.sources?.length) {
        query.bool.filter.push({ terms: { source: filter.sources } })
      }

      if (filter.severities?.length) {
        query.bool.filter.push({ terms: { severity: filter.severities } })
      }

      if (filter.categories?.length) {
        query.bool.filter.push({ terms: { category: filter.categories } })
      }

      if (filter.statuses?.length) {
        query.bool.filter.push({ terms: { status: filter.statuses } })
      }

      if (filter.from_date || filter.to_date) {
        const range: any = {}
        if (filter.from_date) range.gte = filter.from_date
        if (filter.to_date) range.lte = filter.to_date
        query.bool.filter.push({ range: { timestamp: range } })
      }

      if (filter.search) {
        query.bool.must.push({
          multi_match: {
            query: filter.search,
            fields: ['title^2', 'description', 'src_ip', 'dst_ip', 'hostname', 'user']
          }
        })
      }

      const result = await this.elasticsearch.search('security-alerts', {
        query,
        sort: [{ [filter.sort_by || 'timestamp']: { order: filter.sort_order || 'desc' } }],
        from: filter.offset || 0,
        size: filter.limit || 50
      })

      return {
        alerts: result.hits.hits.map((hit: any) => hit._source),
        total: result.hits.total.value
      }
    } catch (error) {
      logger.error('❌ Error searching alerts:', error)
      throw error
    }
  }

  /**
   * Get alert statistics
   */
  async getStats(): Promise<AlertStats> {
    try {
      const now = new Date()
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const aggs = await this.elasticsearch.search('security-alerts', {
        query: {
          range: {
            timestamp: {
              gte: dayAgo.toISOString()
            }
          }
        },
        size: 0,
        aggs: {
          by_severity: { terms: { field: 'severity' } },
          by_category: { terms: { field: 'category' } },
          by_source: { terms: { field: 'source' } },
          by_status: { terms: { field: 'status' } },
          time_series: {
            date_histogram: {
              field: 'timestamp',
              interval: '1h'
            },
            aggs: {
              severity_breakdown: { terms: { field: 'severity' } }
            }
          }
        }
      })

      const stats: AlertStats = {
        total_alerts: aggs.hits.total.value,
        alerts_by_severity: this.aggregationToRecord(aggs.aggregations.by_severity),
        alerts_by_category: this.aggregationToRecord(aggs.aggregations.by_category),
        alerts_by_source: this.aggregationToRecord(aggs.aggregations.by_source),
        alerts_by_status: this.aggregationToRecord(aggs.aggregations.by_status),
        top_sources: aggs.aggregations.by_source.buckets.slice(0, 10),
        avg_resolution_time: await this.calculateAvgResolutionTime(),
        false_positive_rate: await this.calculateFalsePositiveRate(),
        escalation_rate: await this.calculateEscalationRate(),
        time_series: aggs.aggregations.time_series.buckets.map((bucket: any) => ({
          timestamp: bucket.key_as_string,
          count: bucket.doc_count,
          severity_breakdown: this.aggregationToRecord(bucket.severity_breakdown)
        }))
      }

      return stats
    } catch (error) {
      logger.error('❌ Error getting alert stats:', error)
      throw error
    }
  }

  /**
   * Store alert in Elasticsearch and cache in Redis
   */
  private async storeAlert(alert: SecurityAlert): Promise<void> {
    // Store in Elasticsearch for persistence and search
    await this.elasticsearch.index('security-alerts', alert.id, alert)

    // Cache in Redis for fast access
    await this.redis.setex(`alert:${alert.id}`, 3600, JSON.stringify(alert))

    // Add to real-time alert list
    if (alert.status === 'open') {
      await this.redis.lpush('alerts:active', JSON.stringify({
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        title: alert.title
      }))

      // Keep only last 1000 active alerts
      await this.redis.ltrim('alerts:active', 0, 999)
    }
  }

  /**
   * Extract context fields from raw alert
   */
  private extractContextFields(rawAlert: any): Partial<SecurityAlert> {
    const context: Partial<SecurityAlert> = {}

    // Network fields
    if (rawAlert.src_ip) context.src_ip = rawAlert.src_ip
    if (rawAlert.dest_ip || rawAlert.dst_ip) context.dst_ip = rawAlert.dest_ip || rawAlert.dst_ip
    if (rawAlert.src_port) context.src_port = parseInt(rawAlert.src_port)
    if (rawAlert.dest_port || rawAlert.dst_port) context.dst_port = parseInt(rawAlert.dest_port || rawAlert.dst_port)
    if (rawAlert.protocol) context.protocol = rawAlert.protocol

    // Host fields
    if (rawAlert.hostname || rawAlert.host) context.hostname = rawAlert.hostname || rawAlert.host
    if (rawAlert.user || rawAlert.username) context.user = rawAlert.user || rawAlert.username
    if (rawAlert.process_name) context.process_name = rawAlert.process_name
    if (rawAlert.command_line) context.command_line = rawAlert.command_line

    // File fields
    if (rawAlert.file_path) context.file_path = rawAlert.file_path
    if (rawAlert.file_hash) context.file_hash = rawAlert.file_hash
    if (rawAlert.file_name) context.file_name = rawAlert.file_name

    // Registry fields
    if (rawAlert.registry_key) context.registry_key = rawAlert.registry_key
    if (rawAlert.registry_value) context.registry_value = rawAlert.registry_value

    // MITRE mapping
    if (rawAlert.mitre) context.mitre = rawAlert.mitre

    // Tags and metadata
    if (rawAlert.tags) context.tags = Array.isArray(rawAlert.tags) ? rawAlert.tags : [rawAlert.tags]
    if (rawAlert.metadata) context.metadata = rawAlert.metadata

    return context
  }

  /**
   * Apply alert rules and determine actions
   */
  private async applyAlertRules(alert: SecurityAlert): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue

      const matches = rule.conditions.every(condition => {
        return this.evaluateCondition(alert, condition)
      })

      if (matches) {
        logger.debug(`📋 Alert ${alert.id} matches rule: ${rule.name}`)

        // Apply rule properties
        if (rule.category) alert.category = rule.category
        if (rule.severity) alert.severity = rule.severity

        // Execute actions
        for (const action of rule.actions) {
          if (action.enabled) {
            await this.executeAction(alert, action)
          }
        }
      }
    }
  }

  /**
   * Calculate risk score based on multiple factors
   */
  private calculateRiskScore(alert: SecurityAlert): number {
    let score = 0

    // Base score from severity
    const severityScores = { critical: 100, high: 80, medium: 60, low: 40, info: 20 }
    score += severityScores[alert.severity] || 50

    // MITRE confidence boost
    if (alert.mitre?.confidence) {
      score += alert.mitre.confidence * 20
    }

    // Internal asset penalty
    if (this.isInternalIP(alert.src_ip) || this.isInternalIP(alert.dst_ip)) {
      score += 10
    }

    // Known bad indicators
    if (alert.tags?.some(tag => tag.includes('malware') || tag.includes('apt'))) {
      score += 20
    }

    return Math.min(score, 100)
  }

  /**
   * Evaluate a single rule condition
   */
  private evaluateCondition(alert: SecurityAlert, condition: any): boolean {
    const fieldValue = this.getFieldValue(alert, condition.field)

    if (fieldValue === undefined) return false

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue))
      case 'gt':
        return Number(fieldValue) > Number(condition.value)
      case 'lt':
        return Number(fieldValue) < Number(condition.value)
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  }

  /**
   * Execute alert action
   */
  private async executeAction(alert: SecurityAlert, action: any): Promise<void> {
    try {
      switch (action.type) {
        case 'webhook':
          // Implementation for webhook notification
          break
        case 'email':
          // Implementation for email notification
          break
        case 'slack':
          // Implementation for Slack notification
          break
        case 'block_ip':
          if (alert.src_ip) {
            logger.warn(`🚫 Would block IP: ${alert.src_ip}`)
            // Implementation for IP blocking
          }
          break
        case 'quarantine_file':
          if (alert.file_path) {
            logger.warn(`🔒 Would quarantine file: ${alert.file_path}`)
            // Implementation for file quarantine
          }
          break
      }
    } catch (error) {
      logger.error(`❌ Error executing action ${action.type}:`, error)
    }
  }

  /**
   * Helper methods
   */
  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((value, key) => value?.[key], obj)
  }

  private isInternalIP(ip: string | undefined): boolean {
    if (!ip) return false
    return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)
  }

  private aggregationToRecord(agg: any): Record<string, number> {
    const record: Record<string, number> = {}
    agg.buckets.forEach((bucket: any) => {
      record[bucket.key] = bucket.doc_count
    })
    return record
  }

  private async loadAlertRules(): Promise<void> {
    // Load default rules - in production, these would come from database
    const defaultRules: AlertRule[] = [
      {
        id: 'high-risk-malware',
        name: 'High Risk Malware Detection',
        description: 'Detect high-risk malware alerts',
        enabled: true,
        severity: 'critical',
        category: 'malware',
        conditions: [
          { field: 'category', operator: 'equals', value: 'malware' },
          { field: 'risk_score', operator: 'gt', value: 80 }
        ],
        actions: [
          { type: 'slack', config: { channel: '#security-alerts' }, enabled: true },
          { type: 'block_ip', config: {}, enabled: true }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule)
    })

    logger.info(`📋 Loaded ${this.alertRules.size} alert rules`)
  }

  private async calculateAvgResolutionTime(): Promise<number> {
    // Placeholder implementation
    return 3600 // 1 hour in seconds
  }

  private async calculateFalsePositiveRate(): Promise<number> {
    // Placeholder implementation
    return 0.15 // 15%
  }

  private async calculateEscalationRate(): Promise<number> {
    // Placeholder implementation
    return 0.08 // 8%
  }

  async cleanupOldAlerts(): Promise<number> {
    // Delete alerts older than 90 days
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    try {
      const result = await this.elasticsearch.deleteByQuery('security-alerts', {
        query: {
          range: {
            timestamp: {
              lt: cutoffDate.toISOString()
            }
          }
        }
      })

      return result.deleted || 0
    } catch (error) {
      logger.error('❌ Error cleaning up old alerts:', error)
      return 0
    }
  }

  async generateHourlyStats(): Promise<AlertStats> {
    return this.getStats()
  }

  async getActiveAlertCount(): Promise<number> {
    try {
      const result = await this.elasticsearch.count('security-alerts', {
        query: {
          term: { status: 'open' }
        }
      })
      return result.count
    } catch (error) {
      logger.error('❌ Error getting active alert count:', error)
      return 0
    }
  }

  async getTodayProcessedCount(): Promise<number> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const result = await this.elasticsearch.count('security-alerts', {
        query: {
          range: {
            timestamp: {
              gte: today.toISOString()
            }
          }
        }
      })
      return result.count
    } catch (error) {
      logger.error('❌ Error getting today processed count:', error)
      return 0
    }
  }
}