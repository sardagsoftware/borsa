export interface SecurityAlert {
  id: string
  timestamp: string
  source: AlertSource
  severity: AlertSeverity
  category: AlertCategory
  title: string
  description: string
  raw_event?: any

  // Network context
  src_ip?: string
  dst_ip?: string
  src_port?: number
  dst_port?: number
  protocol?: string

  // Host context
  hostname?: string
  user?: string
  process_name?: string
  command_line?: string

  // File context
  file_path?: string
  file_hash?: string
  file_name?: string

  // Registry context (Windows)
  registry_key?: string
  registry_value?: string

  // MITRE ATT&CK mapping
  mitre?: {
    tactic?: string
    technique?: string
    subtechnique?: string
    confidence?: number
  }

  // Alert metadata
  false_positive_probability?: number
  risk_score?: number
  tags?: string[]
  metadata?: Record<string, any>

  // Processing status
  status: AlertStatus
  assigned_to?: string
  escalation_level: number
  created_at: string
  updated_at: string
}

export type AlertSource =
  | 'suricata'
  | 'zeek'
  | 'falco'
  | 'wazuh'
  | 'yara'
  | 'sigma'
  | 'osquery'
  | 'sysmon'
  | 'winlogbeat'
  | 'filebeat'
  | 'custom'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type AlertCategory =
  | 'malware'
  | 'intrusion'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'lateral_movement'
  | 'persistence'
  | 'command_control'
  | 'reconnaissance'
  | 'initial_access'
  | 'defense_evasion'
  | 'credential_access'
  | 'discovery'
  | 'collection'
  | 'impact'
  | 'anomaly'
  | 'compliance'
  | 'policy_violation'

export type AlertStatus =
  | 'open'
  | 'investigating'
  | 'escalated'
  | 'resolved'
  | 'false_positive'
  | 'duplicate'
  | 'suppressed'

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  severity: AlertSeverity
  category: AlertCategory
  conditions: AlertCondition[]
  actions: AlertAction[]
  suppression?: {
    enabled: boolean
    duration_minutes: number
    max_alerts: number
  }
  created_at: string
  updated_at: string
}

export interface AlertCondition {
  field: string
  operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in' | 'not_in'
  value: any
  case_sensitive?: boolean
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'ticket' | 'block_ip' | 'quarantine_file' | 'disable_user'
  config: Record<string, any>
  enabled: boolean
}

export interface AlertStats {
  total_alerts: number
  alerts_by_severity: Record<AlertSeverity, number>
  alerts_by_category: Record<AlertCategory, number>
  alerts_by_source: Record<AlertSource, number>
  alerts_by_status: Record<AlertStatus, number>
  top_sources: Array<{ source: string; count: number }>
  avg_resolution_time: number
  false_positive_rate: number
  escalation_rate: number
  time_series: Array<{
    timestamp: string
    count: number
    severity_breakdown: Record<AlertSeverity, number>
  }>
}

export interface AlertCorrelation {
  id: string
  alerts: string[] // Alert IDs
  correlation_type: 'ip_address' | 'user' | 'hostname' | 'file_hash' | 'attack_pattern'
  correlation_value: string
  confidence: number
  created_at: string
  incident_id?: string
}

export interface AlertResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export interface AlertFilter {
  sources?: AlertSource[]
  severities?: AlertSeverity[]
  categories?: AlertCategory[]
  statuses?: AlertStatus[]
  from_date?: string
  to_date?: string
  search?: string
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface AlertEnrichment {
  threat_intel?: {
    ioc_matches: Array<{
      ioc_type: string
      ioc_value: string
      source: string
      confidence: number
      last_seen: string
    }>
    reputation_scores: Record<string, number>
  }
  geolocation?: {
    src_geo?: GeoLocation
    dst_geo?: GeoLocation
  }
  dns_resolution?: {
    forward_dns: string[]
    reverse_dns: string[]
  }
  vulnerability_context?: {
    cve_ids: string[]
    cvss_scores: number[]
    exploit_available: boolean
  }
}

export interface GeoLocation {
  country: string
  region: string
  city: string
  latitude: number
  longitude: number
  asn: string
  org: string
}

export interface IncidentContext {
  incident_id: string
  title: string
  description: string
  severity: AlertSeverity
  status: 'open' | 'investigating' | 'contained' | 'resolved'
  related_alerts: string[]
  assignee?: string
  created_at: string
  updated_at: string
  timeline: Array<{
    timestamp: string
    action: string
    user: string
    details: string
  }>
}

export interface AlertWebSocketMessage {
  type: 'new_alert' | 'alert_update' | 'alert_stats' | 'correlation' | 'incident'
  data: SecurityAlert | AlertStats | AlertCorrelation | IncidentContext
  timestamp: string
}