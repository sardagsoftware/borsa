import { SecurityEvent, MitreTTPMapping, MappedEvent, MappingStats, TacticInfo } from '@/types'
import mitreData from '@/data/mitre-mapping.json'
import { logger } from '@/index'

export class MappingService {
  private mappings: Record<string, Record<string, MitreTTPMapping>>
  private tactics: TacticInfo[]
  private cache: Map<string, MappedEvent>
  private stats: {
    total_processed: number
    total_mapped: number
    cache_hits: number
  }

  constructor() {
    this.mappings = mitreData.mappings
    this.tactics = mitreData.tactics
    this.cache = new Map()
    this.stats = {
      total_processed: 0,
      total_mapped: 0,
      cache_hits: 0
    }

    logger.info(`🗺️ MITRE Mapper initialized with ${Object.keys(this.mappings).length} source types`)
  }

  /**
   * Map a single security event to MITRE ATT&CK
   */
  async mapEvent(event: SecurityEvent, minConfidence: number = 0.5): Promise<MappedEvent> {
    const cacheKey = this.generateCacheKey(event)

    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.stats.cache_hits++
      return this.cache.get(cacheKey)!
    }

    this.stats.total_processed++

    const mappedEvent: MappedEvent = { ...event }

    try {
      const mapping = await this.findMapping(event)

      if (mapping && mapping.confidence >= minConfidence) {
        const tacticInfo = this.tactics.find(t => t.name === mapping.tactic)

        mappedEvent.mitre = {
          tactic: mapping.tactic,
          technique: mapping.technique,
          subtechnique: mapping.subtechnique || undefined,
          confidence: mapping.confidence,
          description: mapping.description,
          tactic_id: tacticInfo?.id,
          technique_url: `https://attack.mitre.org/techniques/${mapping.technique}/`
        }

        this.stats.total_mapped++
        logger.debug(`✅ Mapped event ${event.id} to ${mapping.technique}`)
      } else {
        logger.debug(`❌ No mapping found for event ${event.id} from ${event.source}`)
      }
    } catch (error) {
      logger.error(`Error mapping event ${event.id}:`, error)
    }

    // Cache the result
    this.cache.set(cacheKey, mappedEvent)

    // Limit cache size to prevent memory issues
    if (this.cache.size > 10000) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    return mappedEvent
  }

  /**
   * Map multiple events in batch
   */
  async mapEvents(events: SecurityEvent[], minConfidence: number = 0.5): Promise<MappedEvent[]> {
    const startTime = Date.now()
    const mappedEvents = await Promise.all(
      events.map(event => this.mapEvent(event, minConfidence))
    )

    const processingTime = Date.now() - startTime
    logger.info(`📊 Mapped ${mappedEvents.length} events in ${processingTime}ms`)

    return mappedEvents
  }

  /**
   * Generate mapping statistics
   */
  generateStats(mappedEvents: MappedEvent[]): MappingStats {
    const totalEvents = mappedEvents.length
    const mappedEventsCount = mappedEvents.filter(e => e.mitre).length

    const tacticCounts: Record<string, number> = {}
    const techniqueCounts: Record<string, number> = {}
    const confidenceDistribution = { high: 0, medium: 0, low: 0 }

    mappedEvents.forEach(event => {
      if (event.mitre) {
        // Count tactics
        tacticCounts[event.mitre.tactic] = (tacticCounts[event.mitre.tactic] || 0) + 1

        // Count techniques
        techniqueCounts[event.mitre.technique] = (techniqueCounts[event.mitre.technique] || 0) + 1

        // Confidence distribution
        if (event.mitre.confidence >= 0.8) {
          confidenceDistribution.high++
        } else if (event.mitre.confidence >= 0.5) {
          confidenceDistribution.medium++
        } else {
          confidenceDistribution.low++
        }
      }
    })

    const topTactics = Object.entries(tacticCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tactic, count]) => ({
        tactic,
        count,
        percentage: Math.round((count / mappedEventsCount) * 100)
      }))

    const topTechniques = Object.entries(techniqueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([technique, count]) => ({
        technique,
        count,
        percentage: Math.round((count / mappedEventsCount) * 100)
      }))

    return {
      total_events: totalEvents,
      mapped_events: mappedEventsCount,
      mapping_rate: totalEvents > 0 ? Math.round((mappedEventsCount / totalEvents) * 100) / 100 : 0,
      top_tactics: topTactics,
      top_techniques: topTechniques,
      confidence_distribution: confidenceDistribution
    }
  }

  /**
   * Find MITRE mapping for an event
   */
  private async findMapping(event: SecurityEvent): Promise<MitreTTPMapping | null> {
    const sourceMappings = this.mappings[event.source]
    if (!sourceMappings) {
      return null
    }

    // Try to find mapping by rule_id first
    if (event.rule_id && sourceMappings[event.rule_id]) {
      return sourceMappings[event.rule_id]
    }

    // Try to find mapping by rule_name
    if (event.rule_name) {
      const mapping = Object.values(sourceMappings).find(
        m => m.rule_name === event.rule_name
      )
      if (mapping) return mapping
    }

    // Try fuzzy matching on title/description
    const searchText = `${event.title} ${event.description}`.toLowerCase()

    for (const [key, mapping] of Object.entries(sourceMappings)) {
      if (searchText.includes(key.toLowerCase()) ||
          searchText.includes(mapping.rule_name.toLowerCase())) {
        // Reduce confidence for fuzzy matches
        return {
          ...mapping,
          confidence: mapping.confidence * 0.8
        }
      }
    }

    return null
  }

  /**
   * Generate cache key for event
   */
  private generateCacheKey(event: SecurityEvent): string {
    return `${event.source}:${event.rule_id || 'unknown'}:${event.rule_name || 'unknown'}`
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      ...this.stats,
      mapping_rate: this.stats.total_processed > 0
        ? Math.round((this.stats.total_mapped / this.stats.total_processed) * 100) / 100
        : 0,
      cache_size: this.cache.size,
      available_sources: Object.keys(this.mappings),
      available_tactics: this.tactics.length
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    logger.info('🧹 MITRE mapper cache cleared')
  }

  /**
   * Get available tactics
   */
  getTactics(): TacticInfo[] {
    return this.tactics
  }

  /**
   * Get coverage for a specific source
   */
  getSourceCoverage(source: string): {
    source: string
    rules_count: number
    tactics_covered: string[]
    techniques_covered: string[]
    avg_confidence: number
  } {
    const sourceMappings = this.mappings[source]
    if (!sourceMappings) {
      return {
        source,
        rules_count: 0,
        tactics_covered: [],
        techniques_covered: [],
        avg_confidence: 0
      }
    }

    const mappingValues = Object.values(sourceMappings)
    const tactics = [...new Set(mappingValues.map(m => m.tactic))]
    const techniques = [...new Set(mappingValues.map(m => m.technique))]
    const avgConfidence = mappingValues.reduce((sum, m) => sum + m.confidence, 0) / mappingValues.length

    return {
      source,
      rules_count: mappingValues.length,
      tactics_covered: tactics,
      techniques_covered: techniques,
      avg_confidence: Math.round(avgConfidence * 100) / 100
    }
  }
}