/**
 * 🛡️ AILYDIAN SOC - Security Operations Center Schema & Types
 * Zod validation schemas for SOC events, sessions, findings, actions, alerts
 * © Emrah Şardağ. All rights reserved.
 */

import { z } from 'zod';

// Base SOC Event Schema
export const SocEventSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date(),
  source: z.enum(['cloudflare', 'vercel', 'waf', 'secscan', 'osint', 'anomaly']),
  ip: z.string().ip().optional(),
  asn: z.string().optional(),
  userAgent: z.string().optional(),
  route: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  country: z.string().length(2).optional(),
  signal: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
});

export type SocEvent = z.infer<typeof SocEventSchema>;

// SOC Session Schema
export const SocSessionSchema = z.object({
  id: z.string().optional(),
  firstSeen: z.date(),
  lastSeen: z.date(),
  actors: z.record(z.unknown()), // IP, ASN, UA fingerprints
  score: z.number().min(0).max(100).default(0),
  eventCount: z.number().default(0),
  metadata: z.record(z.unknown()).optional(),
});

export type SocSession = z.infer<typeof SocSessionSchema>;

// MITRE ATT&CK TTP Finding Schema
export const SocFindingSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date(),
  ttp: z.string(), // T1110, T1055, etc.
  mitreId: z.string(), // Full ID with sub-technique
  tactic: z.string(), // Initial Access, Execution, etc.
  technique: z.string(), // Brute Force, Process Injection, etc.
  risk: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  evidence: z.record(z.unknown()),
  sessionId: z.string().optional(),
});

export type SocFinding = z.infer<typeof SocFindingSchema>;

// SOC Action Schema
export const SocActionSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date(),
  action: z.enum(['rateLimitTighten', 'featureFlagOff', 'triggerCanary', 'throttleIP', 'blockIP', 'quarantineSession']),
  reason: z.string(),
  params: z.record(z.unknown()),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  result: z.record(z.unknown()).optional(),
});

export type SocAction = z.infer<typeof SocActionSchema>;

// SOC Alert Schema
export const SocAlertSchema = z.object({
  id: z.string().optional(),
  timestamp: z.date(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string(),
  body: z.string(),
  links: z.array(z.string().url()).optional(),
  ttp: z.string().optional(),
  channels: z.record(z.boolean()).optional(), // slack, telegram, webhook
  delivered: z.boolean().default(false),
});

export type SocAlert = z.infer<typeof SocAlertSchema>;

// API Request/Response Schemas

// Ingest API
export const IngestRequestSchema = z.object({
  source: z.enum(['cloudflare', 'vercel', 'waf', 'secscan', 'osint', 'anomaly']),
  events: z.array(SocEventSchema),
});

export type IngestRequest = z.infer<typeof IngestRequestSchema>;

// Correlation API
export const CorrelateRequestSchema = z.object({
  windowMinutes: z.number().min(1).max(1440).default(45),
  minEvents: z.number().min(1).default(3),
});

export type CorrelateRequest = z.infer<typeof CorrelateRequestSchema>;

// AI Detection API
export const DetectRequestSchema = z.object({
  sessionIds: z.array(z.string()).optional(),
  timeRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
});

export type DetectRequest = z.infer<typeof DetectRequestSchema>;

export const DetectResponseSchema = z.object({
  sessionId: z.string(),
  riskScore: z.number().min(0).max(100),
  ttps: z.array(z.object({
    mitreId: z.string(),
    name: z.string(),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.string()),
  })),
  summary: z.string(),
});

export type DetectResponse = z.infer<typeof DetectResponseSchema>;

// TTP Map API
export const TtpMapRequestSchema = z.object({
  timeRange: z.enum(['24h', '72h', '7d', '30d']).default('24h'),
  minOccurrences: z.number().min(1).default(1),
});

export type TtpMapRequest = z.infer<typeof TtpMapRequestSchema>;

export const TtpHeatMapSchema = z.object({
  tactic: z.string(),
  technique: z.string(),
  ttp: z.string(),
  count: z.number(),
  avgRisk: z.number().min(0).max(100),
  lastSeen: z.date(),
  compositeScore: z.number().min(0).max(1).optional(),
  avgConfidence: z.number().min(0).max(1).optional(),
  frequency: z.number().min(0).optional(),
});

export type TtpHeatMap = z.infer<typeof TtpHeatMapSchema>;

// Playbook Execution API
export const PlaybookRunRequestSchema = z.object({
  action: z.enum(['rateLimitTighten', 'featureFlagOff', 'triggerCanary', 'throttleIP']),
  params: z.record(z.unknown()),
  reason: z.string(),
  dryRun: z.boolean().default(false),
});

export type PlaybookRunRequest = z.infer<typeof PlaybookRunRequestSchema>;

// SOC Status API
export const SocStatusSchema = z.object({
  eventsIngested: z.number(),
  activeSessions: z.number(),
  highRiskFindings: z.number(),
  alertsSent: z.number(),
  playbooksExecuted: z.number(),
  healthStatus: z.enum(['healthy', 'degraded', 'critical']),
  lastUpdate: z.date(),
});

export type SocStatus = z.infer<typeof SocStatusSchema>;

// Health Check Schema
export const HealthCheckSchema = z.object({
  ingest: z.boolean(),
  correlate: z.boolean(),
  aiDetect: z.boolean(),
  alerts: z.boolean(),
  playbooks: z.boolean(),
  status: z.enum(['ok', 'degraded', 'critical']),
  uptime: z.number(),
  lastCheck: z.date(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// MITRE ATT&CK Knowledge Base Types
export interface MitreTactic {
  id: string;
  name: string;
  description: string;
  techniques: MitreTechnique[];
}

export interface MitreTechnique {
  id: string; // T1110
  name: string; // Brute Force
  description: string;
  tactic: string;
  subTechniques?: MitreSubTechnique[];
  platforms: string[];
  dataSources: string[];
}

export interface MitreSubTechnique {
  id: string; // T1110.001
  name: string; // Password Guessing
  description: string;
  parentTechnique: string;
}

// Event Source Normalization Types
export interface CloudflareEvent {
  timestamp: string;
  clientIP: string;
  userAgent: string;
  uri: string;
  method: string;
  statusCode: number;
  country: string;
  asn: string;
  threatScore: number;
  botScore?: number;
  wafAction?: string;
  edgeResponse: boolean;
}

export interface WAFEvent {
  timestamp: string;
  sourceIP: string;
  userAgent: string;
  uri: string;
  method: string;
  rule: string;
  action: 'allow' | 'block' | 'challenge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  payload?: string;
}

export interface ScanEvent {
  timestamp: string;
  scanType: 'dast' | 'sast' | 'osint' | 'sbom';
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  asset: string;
  evidence: Record<string, unknown>;
}

export interface OSINTEvent {
  timestamp: string;
  source: 'cisa_kev' | 'nvd_cve' | 'github_advisory';
  feedId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  affectedAssets: string[];
}

export interface AnomalyEvent {
  timestamp: string;
  type: 'traffic_spike' | 'error_rate' | 'latency_anomaly' | 'behavioral_anomaly';
  severity: number; // 0-100
  baseline: number;
  current: number;
  deviation: number;
  source: string;
}
