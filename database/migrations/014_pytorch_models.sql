-- ═══════════════════════════════════════════════════════════════
-- PYTORCH MODELS INTEGRATION - DATABASE MIGRATION
-- Adds tables for PyTorch model management, inference tracking, A/B testing
-- ═══════════════════════════════════════════════════════════════

-- PyTorch Models Registry
CREATE TABLE IF NOT EXISTS pytorch_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT UNIQUE NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK(model_type IN ('pytorch', 'onnx', 'torchscript')),
  file_path TEXT NOT NULL,
  file_size_mb REAL,
  domain TEXT NOT NULL CHECK(domain IN ('medical', 'legal', 'civic', 'general', 'chat')),

  -- Model input/output specifications
  input_shape TEXT,  -- JSON: {"image": [1, 3, 224, 224]}
  output_shape TEXT, -- JSON: {"logits": [1, 10]}
  preprocessing TEXT, -- JSON: preprocessing steps

  -- Performance metrics
  avg_inference_time_ms REAL,
  accuracy REAL,
  f1_score REAL,

  -- Deployment info
  deployment_status TEXT DEFAULT 'inactive' CHECK(deployment_status IN ('active', 'inactive', 'testing', 'deprecated')),
  deployment_date DATETIME,

  -- Metadata
  description TEXT,
  training_dataset TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inference Logs (Real-time tracking)
CREATE TABLE IF NOT EXISTS pytorch_inference_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  user_id INTEGER,

  -- Input/Output (for debugging and caching)
  input_hash TEXT,  -- SHA256 of input (for caching)
  input_size_bytes INTEGER,
  output_size_bytes INTEGER,

  -- Performance metrics
  inference_time_ms REAL NOT NULL,
  confidence REAL,

  -- Result (encrypted if sensitive)
  result TEXT,  -- JSON result
  result_class TEXT,  -- Predicted class (for quick filtering)

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (model_id) REFERENCES pytorch_models(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- A/B Testing Framework
CREATE TABLE IF NOT EXISTS pytorch_ab_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_name TEXT UNIQUE NOT NULL,
  model_a_id INTEGER NOT NULL,
  model_b_id INTEGER NOT NULL,

  -- Traffic split (percentage to model_a)
  traffic_split_percent INTEGER DEFAULT 50 CHECK(traffic_split_percent BETWEEN 0 AND 100),

  -- Test period
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME,

  -- Results
  model_a_requests INTEGER DEFAULT 0,
  model_b_requests INTEGER DEFAULT 0,
  model_a_avg_latency_ms REAL,
  model_b_avg_latency_ms REAL,
  model_a_avg_confidence REAL,
  model_b_avg_confidence REAL,

  -- Winner
  winner_model_id INTEGER,
  winner_reason TEXT,

  -- Metrics (JSON)
  detailed_metrics TEXT,

  -- Status
  status TEXT DEFAULT 'running' CHECK(status IN ('draft', 'running', 'completed', 'cancelled')),

  FOREIGN KEY (model_a_id) REFERENCES pytorch_models(id) ON DELETE CASCADE,
  FOREIGN KEY (model_b_id) REFERENCES pytorch_models(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_model_id) REFERENCES pytorch_models(id) ON DELETE SET NULL
);

-- Model Performance History (Daily aggregates)
CREATE TABLE IF NOT EXISTS pytorch_model_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  date DATE NOT NULL,

  -- Daily statistics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,

  -- Performance
  avg_inference_time_ms REAL,
  p50_inference_time_ms REAL,
  p95_inference_time_ms REAL,
  p99_inference_time_ms REAL,

  -- Accuracy tracking (if ground truth available)
  avg_confidence REAL,
  accuracy REAL,

  FOREIGN KEY (model_id) REFERENCES pytorch_models(id) ON DELETE CASCADE,
  UNIQUE(model_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pytorch_inference_model ON pytorch_inference_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_pytorch_inference_time ON pytorch_inference_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_pytorch_inference_user ON pytorch_inference_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pytorch_inference_hash ON pytorch_inference_logs(input_hash);

CREATE INDEX IF NOT EXISTS idx_pytorch_ab_status ON pytorch_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_pytorch_ab_dates ON pytorch_ab_tests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_pytorch_metrics_model ON pytorch_model_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_pytorch_metrics_date ON pytorch_model_metrics(date);

-- Initial seed: Demo medical model (will be replaced with real model)
INSERT OR IGNORE INTO pytorch_models (
  model_name,
  model_version,
  model_type,
  file_path,
  domain,
  input_shape,
  output_shape,
  deployment_status,
  description,
  training_dataset
) VALUES (
  'chest-xray-classifier-demo',
  'v1.0.0-dev',
  'onnx',
  'pytorch-models/onnx/chest_xray_demo.onnx',
  'medical',
  '{"image": [1, 3, 224, 224]}',
  '{"logits": [1, 3], "classes": ["COVID-19", "Pneumonia", "Normal"]}',
  'testing',
  'Chest X-Ray classifier for COVID-19, Pneumonia, Normal detection (Demo model for development)',
  'CheXpert + COVID-19 Image Data Collection'
);
