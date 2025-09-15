import axios from 'axios'
import { SecurityAlert, AlertEnrichment, GeoLocation } from '@/types'
import { logger } from '@/index'
import { RedisManager } from '@/utils/RedisManager'

export class EnrichmentService {
  private redis: RedisManager
  private threatIntelSources: Map<string, any> = new Map()
  private geoLocationCache: Map<string, GeoLocation> = new Map()

  constructor() {
    this.redis = new RedisManager()
    this.setupThreatIntelSources()
  }

  async initialize() {
    logger.info('🔍 Initializing Enrichment Service...')

    try {
      await this.redis.connect()
      await this.loadCachedData()
      logger.info('✅ Enrichment Service initialized successfully')
    } catch (error) {
      logger.error('❌ Failed to initialize Enrichment Service:', error)
      throw error
    }
  }

  /**
   * Enrich alert with threat intelligence, geolocation, and other context
   */
  async enrichAlert(alert: SecurityAlert): Promise<SecurityAlert> {
    try {
      const enrichment: AlertEnrichment = {}

      // Enrich with threat intelligence
      if (alert.src_ip || alert.dst_ip || alert.file_hash) {
        enrichment.threat_intel = await this.getThreatIntelligence(alert)
      }

      // Enrich with geolocation data
      if (alert.src_ip || alert.dst_ip) {
        enrichment.geolocation = await this.getGeolocation(alert)
      }

      // Enrich with DNS resolution
      if (alert.src_ip || alert.dst_ip) {
        enrichment.dns_resolution = await this.getDNSResolution(alert)
      }

      // Enrich with vulnerability context
      if (alert.tags?.some(tag => tag.includes('cve'))) {
        enrichment.vulnerability_context = await this.getVulnerabilityContext(alert)
      }

      // Add enrichment to alert metadata
      alert.metadata = {
        ...alert.metadata,
        enrichment
      }

      // Update risk score based on enrichment
      alert.risk_score = this.updateRiskScoreWithEnrichment(alert.risk_score || 50, enrichment)

      logger.debug(`🔍 Enriched alert ${alert.id} with ${Object.keys(enrichment).length} data sources`)

      return alert
    } catch (error) {
      logger.error(`❌ Error enriching alert ${alert.id}:`, error)
      return alert // Return original alert if enrichment fails
    }
  }

  /**
   * Get threat intelligence data
   */
  private async getThreatIntelligence(alert: SecurityAlert): Promise<any> {
    const intel: any = {
      ioc_matches: [],
      reputation_scores: {}
    }

    const indicators = [
      { type: 'ip', value: alert.src_ip },
      { type: 'ip', value: alert.dst_ip },
      { type: 'hash', value: alert.file_hash }
    ].filter(indicator => indicator.value)

    for (const indicator of indicators) {
      try {
        // Check cache first
        const cacheKey = `threat_intel:${indicator.type}:${indicator.value}`
        const cached = await this.redis.get(cacheKey)

        if (cached) {
          const data = JSON.parse(cached)
          if (data.ioc_matches) intel.ioc_matches.push(...data.ioc_matches)
          if (data.reputation_score) intel.reputation_scores[indicator.value!] = data.reputation_score
          continue
        }

        // Query threat intel sources
        const intelData = await this.queryThreatIntelSources(indicator.type, indicator.value!)

        // Cache results for 1 hour
        await this.redis.setex(cacheKey, 3600, JSON.stringify(intelData))

        if (intelData.ioc_matches) intel.ioc_matches.push(...intelData.ioc_matches)
        if (intelData.reputation_score) intel.reputation_scores[indicator.value!] = intelData.reputation_score
      } catch (error) {
        logger.error(`❌ Error getting threat intel for ${indicator.type} ${indicator.value}:`, error)
      }
    }

    return intel
  }

  /**
   * Get geolocation data for IP addresses
   */
  private async getGeolocation(alert: SecurityAlert): Promise<any> {
    const geo: any = {}

    if (alert.src_ip) {
      geo.src_geo = await this.getIPGeolocation(alert.src_ip)
    }

    if (alert.dst_ip) {
      geo.dst_geo = await this.getIPGeolocation(alert.dst_ip)
    }

    return geo
  }

  /**
   * Get DNS resolution data
   */
  private async getDNSResolution(alert: SecurityAlert): Promise<any> {
    const dns: any = {
      forward_dns: [],
      reverse_dns: []
    }

    // This would integrate with real DNS resolution services
    // For now, return mock data
    if (alert.src_ip && this.isPublicIP(alert.src_ip)) {
      dns.reverse_dns = [`host-${alert.src_ip.replace(/\./g, '-')}.example.com`]
    }

    if (alert.dst_ip && this.isPublicIP(alert.dst_ip)) {
      dns.reverse_dns.push(`host-${alert.dst_ip.replace(/\./g, '-')}.example.com`)
    }

    return dns
  }

  /**
   * Get vulnerability context
   */
  private async getVulnerabilityContext(alert: SecurityAlert): Promise<any> {
    const vulnContext: any = {
      cve_ids: [],
      cvss_scores: [],
      exploit_available: false
    }

    // Extract CVE IDs from tags or description
    const cveRegex = /CVE-\d{4}-\d{4,7}/gi
    const text = `${alert.title} ${alert.description} ${alert.tags?.join(' ') || ''}`
    const cveMatches = text.match(cveRegex)

    if (cveMatches) {
      vulnContext.cve_ids = [...new Set(cveMatches)]

      // Get CVSS scores (mock implementation)
      vulnContext.cvss_scores = vulnContext.cve_ids.map(() => Math.random() * 10)
      vulnContext.exploit_available = vulnContext.cvss_scores.some((score: number) => score > 7.0)
    }

    return vulnContext
  }

  /**
   * Get IP geolocation with caching
   */
  private async getIPGeolocation(ip: string): Promise<GeoLocation | null> {
    if (!this.isPublicIP(ip)) {
      return null
    }

    // Check cache first
    if (this.geoLocationCache.has(ip)) {
      return this.geoLocationCache.get(ip)!
    }

    try {
      // Mock geolocation data - in production, use real geolocation service
      const geoData: GeoLocation = {
        country: 'United States',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        asn: 'AS15169',
        org: 'Google LLC'
      }

      // Cache the result
      this.geoLocationCache.set(ip, geoData)

      // Also cache in Redis for persistence
      await this.redis.setex(`geo:${ip}`, 86400, JSON.stringify(geoData))

      return geoData
    } catch (error) {
      logger.error(`❌ Error getting geolocation for IP ${ip}:`, error)
      return null
    }
  }

  /**
   * Query multiple threat intelligence sources
   */
  private async queryThreatIntelSources(type: string, value: string): Promise<any> {
    const results: any = {
      ioc_matches: [],
      reputation_score: 50 // Neutral score
    }

    // Mock threat intelligence data - in production, integrate with real sources
    // like VirusTotal, IBM X-Force, AlienVault OTX, etc.

    if (type === 'ip') {
      // Mock reputation scoring
      if (this.isKnownBadIP(value)) {
        results.reputation_score = 10 // Bad reputation
        results.ioc_matches.push({
          ioc_type: 'ip',
          ioc_value: value,
          source: 'threat_feed_mock',
          confidence: 0.9,
          last_seen: new Date().toISOString()
        })
      } else if (this.isKnownGoodIP(value)) {
        results.reputation_score = 90 // Good reputation
      }
    } else if (type === 'hash') {
      // Mock hash analysis
      if (value.length === 32 || value.length === 40 || value.length === 64) {
        if (Math.random() < 0.1) { // 10% chance of being malicious
          results.reputation_score = 5
          results.ioc_matches.push({
            ioc_type: 'hash',
            ioc_value: value,
            source: 'malware_database_mock',
            confidence: 0.95,
            last_seen: new Date().toISOString()
          })
        }
      }
    }

    return results
  }

  /**
   * Update risk score based on enrichment data
   */
  private updateRiskScoreWithEnrichment(originalScore: number, enrichment: AlertEnrichment): number {
    let score = originalScore

    // Threat intelligence adjustments
    if (enrichment.threat_intel?.ioc_matches?.length) {
      score += enrichment.threat_intel.ioc_matches.length * 15
    }

    if (enrichment.threat_intel?.reputation_scores) {
      const avgReputation = Object.values(enrichment.threat_intel.reputation_scores)
        .reduce((sum: number, score: any) => sum + score, 0) / Object.keys(enrichment.threat_intel.reputation_scores).length

      if (avgReputation < 30) {
        score += 20 // Bad reputation boost
      }
    }

    // Geolocation adjustments
    if (enrichment.geolocation?.src_geo || enrichment.geolocation?.dst_geo) {
      const geoData = enrichment.geolocation.src_geo || enrichment.geolocation.dst_geo
      if (geoData && this.isHighRiskCountry(geoData.country)) {
        score += 10
      }
    }

    // Vulnerability context adjustments
    if (enrichment.vulnerability_context?.exploit_available) {
      score += 15
    }

    return Math.min(score, 100)
  }

  /**
   * Helper methods
   */
  private setupThreatIntelSources(): void {
    // Configure threat intelligence sources
    this.threatIntelSources.set('virustotal', {
      enabled: process.env.VIRUSTOTAL_ENABLED === 'true',
      api_key: process.env.VIRUSTOTAL_API_KEY,
      rate_limit: 4 // requests per minute
    })

    this.threatIntelSources.set('alienvault', {
      enabled: process.env.ALIENVAULT_ENABLED === 'true',
      api_key: process.env.ALIENVAULT_API_KEY,
      rate_limit: 1000
    })
  }

  private async loadCachedData(): Promise<void> {
    try {
      const keys = await this.redis.keys('geo:*')
      for (const key of keys) {
        const data = await this.redis.get(key)
        if (data) {
          const ip = key.replace('geo:', '')
          this.geoLocationCache.set(ip, JSON.parse(data))
        }
      }
      logger.info(`🗂️ Loaded ${this.geoLocationCache.size} cached geolocation entries`)
    } catch (error) {
      logger.error('❌ Error loading cached data:', error)
    }
  }

  private isPublicIP(ip: string): boolean {
    // Check if IP is not private/reserved
    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^127\./,
      /^169\.254\./,
      /^224\./
    ]

    return !privateRanges.some(range => range.test(ip))
  }

  private isKnownBadIP(ip: string): boolean {
    // Mock implementation - in production, check against known bad IP lists
    const knownBadIPs = ['1.2.3.4', '5.6.7.8']
    return knownBadIPs.includes(ip)
  }

  private isKnownGoodIP(ip: string): boolean {
    // Mock implementation - in production, check against known good IP lists
    const knownGoodIPs = ['8.8.8.8', '1.1.1.1']
    return knownGoodIPs.includes(ip)
  }

  private isHighRiskCountry(country: string): boolean {
    // Mock implementation - define based on threat landscape
    const highRiskCountries = ['North Korea', 'Iran']
    return highRiskCountries.includes(country)
  }
}