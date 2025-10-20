-- Technical Health & Stability Metrics
-- Compatible with PostgreSQL and SQLite
-- Last Updated: 2025-10-12

-- =============================================================================
-- 1. CRASH-FREE RATE
-- =============================================================================
-- Percentage of sessions without crashes
-- Target: 98.5%, Warning: 98.0%, Critical: 97.0%

-- PostgreSQL version
SELECT
    DATE_TRUNC('hour', session_start) AS time_bucket,
    COUNT(*) AS total_sessions,
    COUNT(*) FILTER (WHERE crashed = FALSE) AS crash_free_sessions,
    ROUND(
        (COUNT(*) FILTER (WHERE crashed = FALSE)::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
    ) AS crash_free_rate_pct
FROM telemetry_sessions
WHERE session_start >= NOW() - INTERVAL '24 hours'
GROUP BY time_bucket
ORDER BY time_bucket DESC;

-- SQLite version
-- SELECT
--     DATETIME((CAST(strftime('%s', session_start) AS INTEGER) / 3600) * 3600, 'unixepoch') AS time_bucket,
--     COUNT(*) AS total_sessions,
--     SUM(CASE WHEN crashed = 0 THEN 1 ELSE 0 END) AS crash_free_sessions,
--     ROUND(
--         (CAST(SUM(CASE WHEN crashed = 0 THEN 1 ELSE 0 END) AS REAL) / CAST(COUNT(*) AS REAL)) * 100,
--         2
--     ) AS crash_free_rate_pct
-- FROM telemetry_sessions
-- WHERE session_start >= DATETIME('now', '-24 hours')
-- GROUP BY time_bucket
-- ORDER BY time_bucket DESC;

-- =============================================================================
-- 2. P95 GPU FRAME TIME
-- =============================================================================
-- 95th percentile GPU frame render time
-- Target: 16.6ms, Warning: 18.0ms, Critical: 20.0ms

-- PostgreSQL version
SELECT
    DATE_TRUNC('hour', timestamp) AS time_bucket,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY frame_time_ms) AS p95_gpu_frame_time_ms,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY frame_time_ms) AS p50_gpu_frame_time_ms,
    AVG(frame_time_ms) AS avg_gpu_frame_time_ms,
    COUNT(*) AS sample_count
FROM telemetry_gpu_performance
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND frame_time_ms > 0
  AND frame_time_ms < 1000  -- Filter outliers
GROUP BY time_bucket
ORDER BY time_bucket DESC;

-- SQLite version (approximate percentile)
-- WITH ranked_frames AS (
--     SELECT
--         DATETIME((CAST(strftime('%s', timestamp) AS INTEGER) / 3600) * 3600, 'unixepoch') AS time_bucket,
--         frame_time_ms,
--         ROW_NUMBER() OVER (PARTITION BY DATETIME((CAST(strftime('%s', timestamp) AS INTEGER) / 3600) * 3600, 'unixepoch') ORDER BY frame_time_ms) AS row_num,
--         COUNT(*) OVER (PARTITION BY DATETIME((CAST(strftime('%s', timestamp) AS INTEGER) / 3600) * 3600, 'unixepoch')) AS total_rows
--     FROM telemetry_gpu_performance
--     WHERE timestamp >= DATETIME('now', '-24 hours')
--       AND frame_time_ms > 0
--       AND frame_time_ms < 1000
-- )
-- SELECT
--     time_bucket,
--     AVG(CASE WHEN row_num = CAST(total_rows * 0.95 AS INTEGER) THEN frame_time_ms END) AS p95_gpu_frame_time_ms,
--     AVG(frame_time_ms) AS avg_gpu_frame_time_ms,
--     total_rows AS sample_count
-- FROM ranked_frames
-- GROUP BY time_bucket
-- ORDER BY time_bucket DESC;

-- =============================================================================
-- 3. HITCH RATE
-- =============================================================================
-- Frame time spikes > 2ms
-- Target: < 2ms, Warning: 3ms, Critical: 5ms

-- PostgreSQL version
SELECT
    DATE_TRUNC('hour', timestamp) AS time_bucket,
    COUNT(*) AS total_frames,
    COUNT(*) FILTER (WHERE frame_time_ms > 2.0) AS hitch_count,
    ROUND(
        (COUNT(*) FILTER (WHERE frame_time_ms > 2.0)::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
    ) AS hitch_rate_pct,
    AVG(CASE WHEN frame_time_ms > 2.0 THEN frame_time_ms END) AS avg_hitch_duration_ms
FROM telemetry_gpu_performance
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND frame_time_ms > 0
GROUP BY time_bucket
ORDER BY time_bucket DESC;

-- SQLite version
-- SELECT
--     DATETIME((CAST(strftime('%s', timestamp) AS INTEGER) / 3600) * 3600, 'unixepoch') AS time_bucket,
--     COUNT(*) AS total_frames,
--     SUM(CASE WHEN frame_time_ms > 2.0 THEN 1 ELSE 0 END) AS hitch_count,
--     ROUND(
--         (CAST(SUM(CASE WHEN frame_time_ms > 2.0 THEN 1 ELSE 0 END) AS REAL) / CAST(COUNT(*) AS REAL)) * 100,
--         2
--     ) AS hitch_rate_pct,
--     AVG(CASE WHEN frame_time_ms > 2.0 THEN frame_time_ms END) AS avg_hitch_duration_ms
-- FROM telemetry_gpu_performance
-- WHERE timestamp >= DATETIME('now', '-24 hours')
--   AND frame_time_ms > 0
-- GROUP BY time_bucket
-- ORDER BY time_bucket DESC;

-- =============================================================================
-- 4. SERVER LATENCY (P95)
-- =============================================================================
-- 95th percentile API response time
-- Target: 150ms, Warning: 200ms, Critical: 300ms

-- PostgreSQL version
SELECT
    DATE_TRUNC('hour', timestamp) AS time_bucket,
    endpoint,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_latency_ms,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) AS p50_latency_ms,
    AVG(response_time_ms) AS avg_latency_ms,
    COUNT(*) AS request_count,
    COUNT(*) FILTER (WHERE status_code >= 500) AS error_5xx_count
FROM server_metrics_latency
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND response_time_ms > 0
  AND response_time_ms < 30000  -- Filter 30s+ timeouts
GROUP BY time_bucket, endpoint
ORDER BY time_bucket DESC, p95_latency_ms DESC;

-- Overall server latency (all endpoints)
SELECT
    DATE_TRUNC('hour', timestamp) AS time_bucket,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_latency_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) AS p99_latency_ms,
    AVG(response_time_ms) AS avg_latency_ms,
    COUNT(*) AS request_count
FROM server_metrics_latency
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND response_time_ms > 0
GROUP BY time_bucket
ORDER BY time_bucket DESC;

-- =============================================================================
-- ALERT QUERIES (Check against thresholds)
-- =============================================================================

-- Critical alerts
WITH latest_metrics AS (
    SELECT
        'crash_free_rate' AS metric,
        ROUND((COUNT(*) FILTER (WHERE crashed = FALSE)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) AS current_value,
        97.0 AS critical_threshold
    FROM telemetry_sessions
    WHERE session_start >= NOW() - INTERVAL '1 hour'

    UNION ALL

    SELECT
        'p95_gpu_frame_time' AS metric,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY frame_time_ms) AS current_value,
        20.0 AS critical_threshold
    FROM telemetry_gpu_performance
    WHERE timestamp >= NOW() - INTERVAL '1 hour'
      AND frame_time_ms > 0
      AND frame_time_ms < 1000

    UNION ALL

    SELECT
        'p95_server_latency' AS metric,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS current_value,
        300.0 AS critical_threshold
    FROM server_metrics_latency
    WHERE timestamp >= NOW() - INTERVAL '1 hour'
      AND response_time_ms > 0
)
SELECT
    metric,
    current_value,
    critical_threshold,
    CASE
        WHEN metric = 'crash_free_rate' AND current_value < critical_threshold THEN 'ALERT'
        WHEN metric != 'crash_free_rate' AND current_value > critical_threshold THEN 'ALERT'
        ELSE 'OK'
    END AS status
FROM latest_metrics
WHERE (metric = 'crash_free_rate' AND current_value < critical_threshold)
   OR (metric != 'crash_free_rate' AND current_value > critical_threshold);
