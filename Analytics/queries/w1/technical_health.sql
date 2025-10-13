-- S2 Week 1: Technical Health Metrics
-- Purpose: Track crash-free rate, GPU frame time, hitch rate, server latency
-- Date Range: 2026-01-15 to 2026-01-21 (Week 1)
-- Alert Thresholds: crash-free <98.5%, p95 GPU >16.6ms, hitch >2%

-- Crash-Free Rate
WITH crash_sessions AS (
    SELECT
        DATE(session_started_at) as metric_date,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN crashed = TRUE THEN 1 ELSE 0 END) as crashed_sessions,
        ROUND((COUNT(*) - SUM(CASE WHEN crashed = TRUE THEN 1 ELSE 0 END)) * 100.0 / COUNT(*), 2) as crash_free_pct
    FROM sessions
    WHERE season_id = 'S2'
      AND session_started_at >= '2026-01-15 00:00:00'
      AND session_started_at < '2026-01-22 00:00:00'
    GROUP BY DATE(session_started_at)
),

-- GPU Frame Time (P95)
gpu_frame_time AS (
    SELECT
        DATE(measured_at) as metric_date,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY frame_time_ms) as p95_gpu_frame_time_ms,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY frame_time_ms) as p99_gpu_frame_time_ms,
        AVG(frame_time_ms) as avg_frame_time_ms
    FROM performance_metrics
    WHERE season_id = 'S2'
      AND metric_type = 'gpu_frame_time'
      AND measured_at >= '2026-01-15 00:00:00'
      AND measured_at < '2026-01-22 00:00:00'
    GROUP BY DATE(measured_at)
),

-- Hitch Rate (frames > 2ms over target)
hitch_rate AS (
    SELECT
        DATE(measured_at) as metric_date,
        COUNT(*) as total_frames,
        SUM(CASE WHEN frame_time_ms > 18.6 THEN 1 ELSE 0 END) as hitches,  -- 16.6ms + 2ms = hitch
        ROUND(SUM(CASE WHEN frame_time_ms > 18.6 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as hitch_rate_pct
    FROM performance_metrics
    WHERE season_id = 'S2'
      AND metric_type = 'gpu_frame_time'
      AND measured_at >= '2026-01-15 00:00:00'
      AND measured_at < '2026-01-22 00:00:00'
    GROUP BY DATE(measured_at)
),

-- Server Latency (P95)
server_latency AS (
    SELECT
        DATE(request_timestamp) as metric_date,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency_ms,
        AVG(latency_ms) as avg_latency_ms,
        COUNT(*) as total_requests
    FROM api_logs
    WHERE endpoint LIKE '/api/%'
      AND request_timestamp >= '2026-01-15 00:00:00'
      AND request_timestamp < '2026-01-22 00:00:00'
      AND status_code < 500  -- Exclude server errors from latency calc
    GROUP BY DATE(request_timestamp)
),

-- Error Rate
error_rate AS (
    SELECT
        DATE(request_timestamp) as metric_date,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_requests,
        ROUND(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 4) as error_rate_pct
    FROM api_logs
    WHERE endpoint LIKE '/api/%'
      AND request_timestamp >= '2026-01-15 00:00:00'
      AND request_timestamp < '2026-01-22 00:00:00'
    GROUP BY DATE(request_timestamp)
)

-- Final output
SELECT
    cs.metric_date,
    cs.total_sessions,
    cs.crashed_sessions,
    cs.crash_free_pct,
    CASE
        WHEN cs.crash_free_pct < 98.0 THEN '🔴 CRITICAL'
        WHEN cs.crash_free_pct < 98.5 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as crash_status,

    gft.p95_gpu_frame_time_ms,
    gft.avg_frame_time_ms,
    CASE
        WHEN gft.p95_gpu_frame_time_ms > 20.0 THEN '🔴 CRITICAL'
        WHEN gft.p95_gpu_frame_time_ms > 16.6 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as gpu_status,

    hr.hitch_rate_pct,
    CASE
        WHEN hr.hitch_rate_pct > 5.0 THEN '🔴 CRITICAL'
        WHEN hr.hitch_rate_pct > 2.0 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as hitch_status,

    sl.p95_latency_ms,
    sl.avg_latency_ms,
    CASE
        WHEN sl.p95_latency_ms > 200 THEN '🔴 CRITICAL'
        WHEN sl.p95_latency_ms > 150 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as latency_status,

    er.error_rate_pct,
    CASE
        WHEN er.error_rate_pct > 0.08 THEN '🔴 CRITICAL'
        WHEN er.error_rate_pct > 0.05 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as error_status

FROM crash_sessions cs
LEFT JOIN gpu_frame_time gft ON cs.metric_date = gft.metric_date
LEFT JOIN hitch_rate hr ON cs.metric_date = hr.metric_date
LEFT JOIN server_latency sl ON cs.metric_date = sl.metric_date
LEFT JOIN error_rate er ON cs.metric_date = er.metric_date
ORDER BY cs.metric_date;

-- Target KPIs:
-- Crash-Free Rate: ≥98.5%
-- P95 GPU Frame Time: ≤16.6ms
-- Hitch Rate: <2%
-- P95 Server Latency: ≤150ms
-- Error Rate: <0.05%
