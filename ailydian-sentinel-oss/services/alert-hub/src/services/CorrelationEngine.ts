import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { SecurityAlert, AlertCorrelation } from '@/types'
import { logger } from '@/index'
import { ElasticsearchManager } from '@/utils/ElasticsearchManager'
import _ from 'lodash'

export class CorrelationEngine extends EventEmitter {
  private elasticsearch: ElasticsearchManager
  private correlations: Map<string, AlertCorrelation> = new Map()
  private analysisWindow: number = 300000 // 5 minutes in milliseconds

  constructor() {
    super()
    this.elasticsearch = new ElasticsearchManager()
  }

  async initialize() {
    logger.info('🔗 Initializing Correlation Engine...')

    try {
      await this.elasticsearch.connect()
      logger.info('✅ Correlation Engine initialized successfully')
    } catch (error) {
      logger.error('❌ Failed to initialize Correlation Engine:', error)
      throw error
    }
  }

  /**
   * Run correlation analysis on recent alerts
   */
  async runAnalysis(): Promise<void> {
    try {
      const recentAlerts = await this.getRecentAlerts()
      
      if (recentAlerts.length < 2) {
        logger.debug('🔗 Not enough alerts for correlation analysis')
        return
      }

      const correlations = await this.findCorrelations(recentAlerts)
      
      for (const correlation of correlations) {
        await this.processCorrelation(correlation)
      }

      logger.debug(`🔗 Processed ${correlations.length} correlations from ${recentAlerts.length} alerts`)
    } catch (error) {
      logger.error('❌ Error in correlation analysis:', error)
    }
  }

  /**
   * Find correlations between alerts
   */
  private async findCorrelations(alerts: SecurityAlert[]): Promise<AlertCorrelation[]> {
    const correlations: AlertCorrelation[] = []

    // Group alerts by potential correlation keys
    const correlationGroups = {
      ip_address: this.groupAlertsByField(alerts, ['src_ip', 'dst_ip']),
      user: this.groupAlertsByField(alerts, ['user']),
      hostname: this.groupAlertsByField(alerts, ['hostname']),
      file_hash: this.groupAlertsByField(alerts, ['file_hash']),
      attack_pattern: this.groupAlertsByAttackPattern(alerts)
    }

    // Generate correlations for each group type
    for (const [correlationType, groups] of Object.entries(correlationGroups)) {
      for (const [value, groupedAlerts] of Object.entries(groups)) {
        if (groupedAlerts.length >= 2) {
          const correlation = await this.createCorrelation(
            correlationType as any,
            value,
            groupedAlerts
          )
          if (correlation) {
            correlations.push(correlation)
          }
        }
      }
    }

    return correlations
  }

  /**
   * Group alerts by specified fields
   */
  private groupAlertsByField(alerts: SecurityAlert[], fields: string[]): Record<string, SecurityAlert[]> {
    const groups: Record<string, SecurityAlert[]> = {}

    for (const alert of alerts) {
      for (const field of fields) {
        const value = _.get(alert, field)
        if (value) {
          if (!groups[value]) {
            groups[value] = []
          }
          groups[value].push(alert)
        }
      }
    }

    return groups
  }

  /**
   * Group alerts by attack patterns (MITRE techniques)
   */
  private groupAlertsByAttackPattern(alerts: SecurityAlert[]): Record<string, SecurityAlert[]> {
    const groups: Record<string, SecurityAlert[]> = {}

    for (const alert of alerts) {
      if (alert.mitre?.technique) {
        const technique = alert.mitre.technique
        if (!groups[technique]) {
          groups[technique] = []
        }
        groups[technique].push(alert)
      }
    }

    return groups
  }

  /**
   * Create correlation object
   */
  private async createCorrelation(
    type: 'ip_address' | 'user' | 'hostname' | 'file_hash' | 'attack_pattern',
    value: string,
    alerts: SecurityAlert[]
  ): Promise<AlertCorrelation | null> {
    // Filter out alerts that are too similar (potential duplicates)
    const uniqueAlerts = this.filterUniqueAlerts(alerts)
    
    if (uniqueAlerts.length < 2) {
      return null
    }

    // Calculate correlation confidence
    const confidence = this.calculateCorrelationConfidence(type, uniqueAlerts)
    
    if (confidence < 0.5) {
      return null
    }

    const correlationId = uuidv4()
    const correlation: AlertCorrelation = {
      id: correlationId,
      alerts: uniqueAlerts.map(a => a.id),
      correlation_type: type,
      correlation_value: value,
      confidence,
      created_at: new Date().toISOString()
    }

    return correlation
  }

  /**
   * Filter out duplicate or very similar alerts
   */
  private filterUniqueAlerts(alerts: SecurityAlert[]): SecurityAlert[] {
    const uniqueAlerts: SecurityAlert[] = []
    const signatures = new Set<string>()

    for (const alert of alerts) {
      // Create a signature for the alert to detect duplicates
      const signature = this.createAlertSignature(alert)
      
      if (!signatures.has(signature)) {
        signatures.add(signature)
        uniqueAlerts.push(alert)
      }
    }

    return uniqueAlerts
  }

  /**
   * Create a signature for alert deduplication
   */
  private createAlertSignature(alert: SecurityAlert): string {
    const key = [
      alert.source,
      alert.title,
      alert.src_ip || '',
      alert.dst_ip || '',
      alert.hostname || '',
      alert.user || '',
      Math.floor(new Date(alert.timestamp).getTime() / 60000) // Round to minute
    ].join('|')

    return key
  }

  /**
   * Calculate correlation confidence based on various factors
   */
  private calculateCorrelationConfidence(
    type: 'ip_address' | 'user' | 'hostname' | 'file_hash' | 'attack_pattern',
    alerts: SecurityAlert[]
  ): number {
    let confidence = 0.5 // Base confidence

    // Time-based scoring - alerts closer in time get higher confidence
    const timestamps = alerts.map(a => new Date(a.timestamp).getTime())
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps)
    const timeScore = Math.max(0, 1 - (timeSpan / this.analysisWindow))
    confidence += timeScore * 0.2

    // Diversity scoring - more diverse sources/types increase confidence
    const sources = new Set(alerts.map(a => a.source))
    const categories = new Set(alerts.map(a => a.category))
    const diversityScore = (sources.size + categories.size) / (alerts.length * 2)
    confidence += diversityScore * 0.1

    // Severity scoring - higher severity alerts increase confidence
    const severityScores = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4, info: 0.2 }
    const avgSeverityScore = alerts.reduce((sum, alert) => {
      return sum + (severityScores[alert.severity] || 0.5)
    }, 0) / alerts.length
    confidence += avgSeverityScore * 0.1

    // Correlation type specific adjustments
    switch (type) {
      case 'ip_address':
        // IP correlations are generally high confidence
        confidence += 0.1
        break
      case 'file_hash':
        // File hash correlations are very high confidence
        confidence += 0.2
        break
      case 'attack_pattern':
        // MITRE technique correlations are high confidence
        confidence += 0.15
        break
      case 'user':
        // User-based correlations can be high if from different sources
        if (sources.size > 1) confidence += 0.1
        break
      case 'hostname':
        // Hostname correlations are medium confidence
        confidence += 0.05
        break
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Process and store correlation
   */
  private async processCorrelation(correlation: AlertCorrelation): Promise<void> {
    try {
      // Check if this correlation already exists
      const existing = await this.findExistingCorrelation(correlation)
      if (existing) {
        logger.debug(`🔗 Correlation already exists: ${existing.id}`)
        return
      }

      // Store correlation
      await this.storeCorrelation(correlation)
      this.correlations.set(correlation.id, correlation)

      // Emit correlation event
      this.emit('correlation', correlation)

      // Check if correlation should trigger incident creation
      if (correlation.confidence > 0.8 || correlation.alerts.length > 3) {
        await this.createIncidentFromCorrelation(correlation)
      }

      logger.info(
        `🔗 Created correlation ${correlation.id}: ` +
        `${correlation.correlation_type}=${correlation.correlation_value} ` +
        `(${correlation.alerts.length} alerts, confidence: ${correlation.confidence.toFixed(2)})`
      )
    } catch (error) {
      logger.error(`❌ Error processing correlation:`, error)
    }
  }

  /**
   * Find existing correlation to avoid duplicates
   */
  private async findExistingCorrelation(correlation: AlertCorrelation): Promise<AlertCorrelation | null> {
    try {
      const result = await this.elasticsearch.search('alert-correlations', {
        query: {
          bool: {
            must: [
              { term: { correlation_type: correlation.correlation_type } },
              { term: { correlation_value: correlation.correlation_value } },
              {
                range: {
                  created_at: {
                    gte: new Date(Date.now() - this.analysisWindow).toISOString()
                  }
                }
              }
            ]
          }
        }
      })

      return result.hits.hits.length > 0 ? result.hits.hits[0]._source : null
    } catch (error) {
      logger.error('❌ Error finding existing correlation:', error)
      return null
    }
  }

  /**
   * Store correlation in Elasticsearch
   */
  private async storeCorrelation(correlation: AlertCorrelation): Promise<void> {
    await this.elasticsearch.index('alert-correlations', correlation.id, correlation)
  }

  /**
   * Create incident from high-confidence correlation
   */
  private async createIncidentFromCorrelation(correlation: AlertCorrelation): Promise<void> {
    try {
      const incidentId = uuidv4()
      const incident = {
        incident_id: incidentId,
        title: `Security Incident: ${correlation.correlation_type} ${correlation.correlation_value}`,
        description: `Automated incident created from correlation of ${correlation.alerts.length} related alerts`,
        severity: this.determineIncidentSeverity(correlation),
        status: 'open',
        related_alerts: correlation.alerts,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        timeline: [{
          timestamp: new Date().toISOString(),
          action: 'Incident Created',
          user: 'system',
          details: `Created from correlation ${correlation.id}`
        }]
      }

      // Store incident
      await this.elasticsearch.index('security-incidents', incidentId, incident)
      
      // Update correlation with incident reference
      correlation.incident_id = incidentId
      await this.storeCorrelation(correlation)

      // Emit incident event
      this.emit('incident', incident)

      logger.warn(
        `🚨 Created security incident ${incidentId} from correlation ${correlation.id} ` +
        `(${correlation.alerts.length} alerts)`
      )
    } catch (error) {
      logger.error('❌ Error creating incident from correlation:', error)
    }
  }

  /**
   * Determine incident severity based on correlation
   */
  private determineIncidentSeverity(correlation: AlertCorrelation): 'critical' | 'high' | 'medium' | 'low' {
    if (correlation.confidence > 0.9 || correlation.alerts.length > 5) {
      return 'critical'
    } else if (correlation.confidence > 0.8 || correlation.alerts.length > 3) {
      return 'high'
    } else if (correlation.confidence > 0.7) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * Get recent alerts for analysis
   */
  private async getRecentAlerts(): Promise<SecurityAlert[]> {
    try {
      const result = await this.elasticsearch.search('security-alerts', {
        query: {
          range: {
            timestamp: {
              gte: new Date(Date.now() - this.analysisWindow).toISOString()
            }
          }
        },
        sort: [{ timestamp: { order: 'desc' } }],
        size: 1000 // Limit to prevent memory issues
      })

      return result.hits.hits.map((hit: any) => hit._source)
    } catch (error) {
      logger.error('❌ Error getting recent alerts for correlation:', error)
      return []
    }
  }

  /**
   * Get correlation statistics
   */
  async getCorrelationStats(): Promise<any> {
    try {
      const result = await this.elasticsearch.search('alert-correlations', {
        query: {
          range: {
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
          }
        },
        size: 0,
        aggs: {
          by_type: { terms: { field: 'correlation_type' } },
          confidence_histogram: {
            histogram: {
              field: 'confidence',
              interval: 0.1
            }
          }
        }
      })

      return {
        total_correlations: result.hits.total.value,
        by_type: result.aggregations.by_type.buckets,
        confidence_distribution: result.aggregations.confidence_histogram.buckets
      }
    } catch (error) {
      logger.error('❌ Error getting correlation stats:', error)
      return { total_correlations: 0, by_type: [], confidence_distribution: [] }
    }
  }
}