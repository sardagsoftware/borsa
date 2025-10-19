export type AutoTriagePolicy = {
  enabled: boolean;
  thresholds: {
    sev1_consecutive: number;
    sev2_consecutive: number;
    window_seconds: number;
  };
  rollback_enabled: boolean;
  rollback_guard: {
    min_down_endpoints: number;
    min_duration_seconds: number;
  };
};

export type TriageDecision = {
  sev: 1 | 2 | 3;
  rollback: boolean;
  reason: string;
  tag: string;
};

export type RollbackAction = {
  ts: number;
  trigger: string;
  status: 'pending' | 'success' | 'failed';
  deploymentId?: string;
};
