export type HealthStatus = 'up' | 'warn' | 'down';

export type HealthRow = {
  name: string;
  url: string;
  code: number;
  ms: number;
  status: HealthStatus;
  err?: string | null;
  group?: string;
};

export type HealthSnapshot = {
  ts: number;
  items: HealthRow[];
};

export type IncidentTag =
  | 'DNS'
  | 'Auth'
  | 'Upstream'
  | 'RateLimit'
  | 'Network'
  | 'Redirect'
  | 'Client4xx'
  | 'Server5xx'
  | 'Security'
  | 'Unknown';

export type Incident = {
  id: string;
  ts: number;
  target: string;
  tag: IncidentTag;
  sev: 1 | 2 | 3;
  message: string;
  rollback?: boolean;
  slackPushed?: boolean;
  jiraPushed?: boolean;
};

export type SLAGroup = {
  name: string;
  uptimeTarget: number;
  p95TargetMs: number;
};

export type TriageConfig = {
  defaults: { sev: number; rollback: boolean };
  thresholds: {
    p95_ms: { sev2: number; sev1: number };
    down_count: { sev3: number; sev2: number; sev1: number };
  };
  byTag: Record<string, { sev: number; rollback: boolean }>;
  groupWeights?: Record<string, number>;
  rollback_guard?: {
    min_down_endpoints: number;
    min_duration_seconds: number;
  };
};

export type FeatureFlags = {
  env: string;
  features: {
    autoTriage: boolean;
    autoRollback: boolean;
  };
  autoRules: {
    sev1_consecutive: number;
    window_seconds: number;
  };
};
