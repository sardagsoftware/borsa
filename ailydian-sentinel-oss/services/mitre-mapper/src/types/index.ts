export interface SecurityEvent {
  id: string
  timestamp: string
  source: 'suricata' | 'zeek' | 'falco' | 'wazuh' | 'yara' | 'sigma' | 'custom'
  rule_id?: string
  rule_name?: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  src_ip?: string
  dst_ip?: string
  src_port?: number
  dst_port?: number
  protocol?: string
  user?: string
  hostname?: string
  process_name?: string
  command_line?: string
  file_path?: string
  file_hash?: string
  registry_key?: string
  raw_log?: string
  metadata?: Record<string, any>
}

export interface MitreTTPMapping {
  rule_name: string
  tactic: string
  technique: string
  subtechnique?: string | null
  confidence: number
  description: string
}

export interface MappedEvent extends SecurityEvent {
  mitre?: {
    tactic: string
    technique: string
    subtechnique?: string
    confidence: number
    description: string
    tactic_id?: string
    technique_url?: string
  }
}

export interface TacticInfo {
  id: string
  name: string
  description: string
}

export interface MappingStats {
  total_events: number
  mapped_events: number
  mapping_rate: number
  top_tactics: Array<{
    tactic: string
    count: number
    percentage: number
  }>
  top_techniques: Array<{
    technique: string
    count: number
    percentage: number
  }>
  confidence_distribution: {
    high: number // 0.8+
    medium: number // 0.5-0.8
    low: number // <0.5
  }
}

export interface MappingRequest {
  events: SecurityEvent[]
  include_metadata?: boolean
  min_confidence?: number
}

export interface MappingResponse {
  success: true
  data: {
    mapped_events: MappedEvent[]
    stats: MappingStats
    unmapped_count: number
    processing_time_ms: number
  }
}

export interface ErrorResponse {
  success: false
  error: string
  message: string
  code?: string
}

// API Response types
export type ApiResponse<T = any> =
  | (MappingResponse & { data: T })
  | ErrorResponse

// Enrichment options
export interface EnrichmentOptions {
  include_d3fend?: boolean // Include D3FEND countermeasures
  include_capec?: boolean // Include CAPEC attack patterns
  include_cwe?: boolean // Include CWE weaknesses
  include_nist?: boolean // Include NIST SP 800-53 controls
}