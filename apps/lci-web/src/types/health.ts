// 🏥 HEALTH MONITORING TYPES

export type HealthStatus = 'up' | 'warn' | 'down';

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

export type HealthTarget = {
  name: string;
  url: string;
  group?: 'Modules' | 'Developers' | 'Company';
};

export type HealthRow = {
  name: string;
  url: string;
  code: number;
  ms: number;
  status: HealthStatus;
  err?: string | null;
};

export type HealthSnapshot = {
  ts: number;
  items: HealthRow[];
};

export type ClassifiedIncident = HealthRow & {
  tag: IncidentTag;
  hint?: string;
};

export type ActionNote = {
  title: string;
  steps: string[];
};

export type SLAGroup = {
  name: string;
  uptimeTarget: number;
  p95TargetMs: number;
  targets: string[];
};

export type SLAConfig = {
  groups: Record<string, SLAGroup>;
};

export type GroupMetrics = {
  uptimePct: number;
  p95: number;
  samples: number;
};
