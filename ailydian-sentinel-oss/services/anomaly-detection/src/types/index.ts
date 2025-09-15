export interface AnomalyEvent {
  id: string
  timestamp: string
  source: string
  event_type: AnomalyType
  severity: AnomalySeverity
  confidence: number
  description: string
  
  // Original data that triggered the anomaly
  raw_data: any
  
  // Features that contributed to the anomaly
  anomalous_features: Array<{
    name: string
    value: number | string
    expected_value?: number | string
    deviation_score: number
  }>
  
  // ML model information
  model_info: {
    model_name: string
    model_version: string
    algorithm: string
    training_data_size: number
    last_trained: string
  }
  
  // Context information
  context: {
    baseline_period: string
    comparison_window: string
    affected_entities: string[]
    related_events: string[]
  }
  
  // Metadata
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export type AnomalyType =
  | 'statistical_outlier'
  | 'behavioral_anomaly'
  | 'time_series_anomaly'
  | 'clustering_anomaly'
  | 'frequency_anomaly'
  | 'pattern_deviation'
  | 'volume_spike'
  | 'geo_anomaly'
  | 'network_anomaly'
  | 'user_behavior_anomaly'
  | 'system_anomaly'
  | 'custom'

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface DataPoint {
  timestamp: string
  value: number | string
  features: Record<string, number | string>
  metadata?: Record<string, any>
}

export interface AnomalyModel {
  id: string
  name: string
  algorithm: AnomalyAlgorithm
  status: ModelStatus
  version: string
  description: string
  
  // Training configuration
  config: {
    window_size: number
    threshold: number
    sensitivity: number
    min_samples: number
    features: string[]
    target_field?: string
  }
  
  // Performance metrics
  metrics: {
    accuracy?: number
    precision?: number
    recall?: number
    f1_score?: number
    false_positive_rate?: number
    training_loss?: number
  }
  
  // Training information
  training_info: {
    data_sources: string[]
    training_period: {
      start: string
      end: string
    }
    sample_count: number
    feature_importance?: Record<string, number>
  }
  
  created_at: string
  updated_at: string
  last_trained: string
}

export type AnomalyAlgorithm =
  | 'isolation_forest'
  | 'local_outlier_factor'
  | 'one_class_svm'
  | 'autoencoder'
  | 'statistical_threshold'
  | 'z_score'
  | 'iqr_outlier'
  | 'seasonal_decomposition'
  | 'arima'
  | 'lstm_autoencoder'
  | 'clustering_based'
  | 'ensemble'

export type ModelStatus = 'training' | 'trained' | 'deployed' | 'retired' | 'failed'

export interface AnomalyDetectionRequest {
  data_points: DataPoint[]
  model_ids?: string[]
  real_time?: boolean
  threshold_override?: number
  context?: Record<string, any>
}

export interface AnomalyDetectionResponse {
  success: boolean
  data?: {
    anomalies: AnomalyEvent[]
    model_results: Array<{
      model_id: string
      model_name: string
      anomaly_score: number
      threshold: number
      is_anomaly: boolean
      confidence: number
    }>
    processing_time_ms: number
    data_points_processed: number
  }
  error?: string
  message?: string
}

export interface BaselineProfile {
  id: string
  name: string
  entity_type: string // e.g., 'user', 'host', 'network_segment'
  entity_id: string
  
  // Statistical baselines
  statistics: {
    mean: Record<string, number>
    std_dev: Record<string, number>
    percentiles: Record<string, Record<number, number>> // P50, P95, P99
    min_max: Record<string, { min: number; max: number }>
  }
  
  // Behavioral patterns
  patterns: {
    hourly_activity: number[]
    daily_activity: number[]
    weekly_activity: number[]
    common_actions: Array<{
      action: string
      frequency: number
      typical_time: string[]
    }>
  }
  
  // Temporal information
  baseline_period: {
    start: string
    end: string
    duration_days: number
  }
  
  // Confidence and quality metrics
  confidence: number
  data_quality_score: number
  sample_size: number
  
  created_at: string
  updated_at: string
  last_validated: string
}

export interface AnomalyStats {
  total_anomalies: number
  anomalies_by_type: Record<AnomalyType, number>
  anomalies_by_severity: Record<AnomalySeverity, number>
  anomalies_by_source: Record<string, number>
  
  // Time series data
  time_series: Array<{
    timestamp: string
    count: number
    severity_breakdown: Record<AnomalySeverity, number>
  }>
  
  // Model performance
  model_performance: Array<{
    model_id: string
    model_name: string
    detections: number
    accuracy: number
    false_positive_rate: number
    last_updated: string
  }>
  
  // Top anomalous entities
  top_anomalous_entities: Array<{
    entity_type: string
    entity_id: string
    anomaly_count: number
    max_severity: AnomalySeverity
    latest_anomaly: string
  }>
}

export interface SelfHealingAction {
  id: string
  trigger_anomaly_id: string
  action_type: SelfHealingActionType
  status: ActionStatus
  description: string
  
  // Action configuration
  config: {
    target: string
    parameters: Record<string, any>
    timeout_seconds: number
    retry_attempts: number
  }
  
  // Execution details
  execution: {
    started_at?: string
    completed_at?: string
    result?: any
    error_message?: string
    retry_count: number
  }
  
  // Approval workflow
  approval?: {
    required: boolean
    approved_by?: string
    approved_at?: string
    rejection_reason?: string
  }
  
  created_at: string
  updated_at: string
}

export type SelfHealingActionType =
  | 'block_ip'
  | 'quarantine_user'
  | 'disable_service'
  | 'restart_service'
  | 'scale_resources'
  | 'update_firewall_rules'
  | 'rotate_credentials'
  | 'isolate_host'
  | 'send_alert'
  | 'create_incident'
  | 'run_script'
  | 'api_call'
  | 'custom'

export type ActionStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled'

export interface AnomalyWebSocketMessage {
  type: 'anomaly_detected' | 'model_updated' | 'baseline_updated' | 'healing_action' | 'stats_update'
  data: AnomalyEvent | AnomalyModel | BaselineProfile | SelfHealingAction | AnomalyStats
  timestamp: string
}

export interface TrainingDataSet {
  id: string
  name: string
  description: string
  source: string
  
  // Data information
  data_info: {
    total_samples: number
    feature_count: number
    time_range: {
      start: string
      end: string
    }
    data_quality_score: number
  }
  
  // Feature information
  features: Array<{
    name: string
    type: 'numeric' | 'categorical' | 'text' | 'datetime'
    null_percentage: number
    unique_values: number
    statistics?: {
      mean?: number
      std?: number
      min?: number
      max?: number
    }
  }>
  
  // Labels (if supervised learning)
  labels?: {
    anomaly_percentage: number
    label_distribution: Record<string, number>
  }
  
  created_at: string
  updated_at: string
}

export interface FeatureEngineeringPipeline {
  id: string
  name: string
  description: string
  
  // Pipeline steps
  steps: Array<{
    step_type: 'normalize' | 'scale' | 'encode' | 'aggregate' | 'window' | 'difference' | 'custom'
    parameters: Record<string, any>
    input_features: string[]
    output_features: string[]
  }>
  
  // Input/Output schema
  input_schema: Record<string, string> // feature_name -> type
  output_schema: Record<string, string>
  
  created_at: string
  updated_at: string
}