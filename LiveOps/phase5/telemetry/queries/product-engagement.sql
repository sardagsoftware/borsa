-- Product Engagement Metrics
-- Compatible with PostgreSQL and SQLite
-- Last Updated: 2025-10-12

-- =============================================================================
-- 1. DAU (Daily Active Users)
-- =============================================================================
-- Unique users per day

-- PostgreSQL version
SELECT
    DATE_TRUNC('day', session_start)::DATE AS day,
    COUNT(DISTINCT user_id) AS dau,
    COUNT(*) AS total_sessions,
    ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT user_id)::NUMERIC, 2) AS avg_sessions_per_user
FROM telemetry_sessions
WHERE session_start >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- SQLite version
-- SELECT
--     DATE(session_start) AS day,
--     COUNT(DISTINCT user_id) AS dau,
--     COUNT(*) AS total_sessions,
--     ROUND(CAST(COUNT(*) AS REAL) / CAST(COUNT(DISTINCT user_id) AS REAL), 2) AS avg_sessions_per_user
-- FROM telemetry_sessions
-- WHERE session_start >= DATE('now', '-30 days')
-- GROUP BY day
-- ORDER BY day DESC;

-- =============================================================================
-- 2. MAU (Monthly Active Users)
-- =============================================================================
-- Unique users per month

-- PostgreSQL version
SELECT
    DATE_TRUNC('month', session_start)::DATE AS month,
    COUNT(DISTINCT user_id) AS mau,
    COUNT(*) AS total_sessions
FROM telemetry_sessions
WHERE session_start >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- =============================================================================
-- 3. DAU/MAU RATIO (Stickiness)
-- =============================================================================

WITH daily_users AS (
    SELECT
        DATE_TRUNC('day', session_start)::DATE AS day,
        COUNT(DISTINCT user_id) AS dau
    FROM telemetry_sessions
    WHERE session_start >= NOW() - INTERVAL '30 days'
    GROUP BY day
),
monthly_users AS (
    SELECT
        DATE_TRUNC('month', session_start)::DATE AS month,
        COUNT(DISTINCT user_id) AS mau
    FROM telemetry_sessions
    WHERE session_start >= NOW() - INTERVAL '30 days'
    GROUP BY month
)
SELECT
    d.day,
    d.dau,
    m.mau,
    ROUND((d.dau::NUMERIC / m.mau::NUMERIC) * 100, 2) AS dau_mau_ratio_pct
FROM daily_users d
CROSS JOIN monthly_users m
ORDER BY d.day DESC;

-- =============================================================================
-- 4. RETENTION (D1, D7, D30)
-- =============================================================================
-- Cohort-based retention analysis

-- D1 Retention (players returning after 1 day)
WITH cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('day', MIN(session_start))::DATE AS cohort_date
    FROM telemetry_sessions
    GROUP BY user_id
),
day1_returns AS (
    SELECT
        c.cohort_date,
        COUNT(DISTINCT c.user_id) AS cohort_size,
        COUNT(DISTINCT CASE
            WHEN s.session_start >= c.cohort_date + INTERVAL '1 day'
             AND s.session_start < c.cohort_date + INTERVAL '2 days'
            THEN c.user_id
        END) AS d1_retained
    FROM cohorts c
    LEFT JOIN telemetry_sessions s ON c.user_id = s.user_id
    WHERE c.cohort_date >= NOW() - INTERVAL '30 days'
      AND c.cohort_date < NOW() - INTERVAL '2 days'  -- Allow time for D1 return
    GROUP BY c.cohort_date
)
SELECT
    cohort_date,
    cohort_size,
    d1_retained,
    ROUND((d1_retained::NUMERIC / cohort_size::NUMERIC) * 100, 2) AS d1_retention_pct
FROM day1_returns
ORDER BY cohort_date DESC;

-- D7 Retention (players returning after 7 days)
WITH cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('day', MIN(session_start))::DATE AS cohort_date
    FROM telemetry_sessions
    GROUP BY user_id
),
day7_returns AS (
    SELECT
        c.cohort_date,
        COUNT(DISTINCT c.user_id) AS cohort_size,
        COUNT(DISTINCT CASE
            WHEN s.session_start >= c.cohort_date + INTERVAL '7 days'
             AND s.session_start < c.cohort_date + INTERVAL '8 days'
            THEN c.user_id
        END) AS d7_retained
    FROM cohorts c
    LEFT JOIN telemetry_sessions s ON c.user_id = s.user_id
    WHERE c.cohort_date >= NOW() - INTERVAL '60 days'
      AND c.cohort_date < NOW() - INTERVAL '8 days'  -- Allow time for D7 return
    GROUP BY c.cohort_date
)
SELECT
    cohort_date,
    cohort_size,
    d7_retained,
    ROUND((d7_retained::NUMERIC / cohort_size::NUMERIC) * 100, 2) AS d7_retention_pct
FROM day7_returns
ORDER BY cohort_date DESC;

-- D30 Retention (players returning after 30 days)
WITH cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('day', MIN(session_start))::DATE AS cohort_date
    FROM telemetry_sessions
    GROUP BY user_id
),
day30_returns AS (
    SELECT
        c.cohort_date,
        COUNT(DISTINCT c.user_id) AS cohort_size,
        COUNT(DISTINCT CASE
            WHEN s.session_start >= c.cohort_date + INTERVAL '30 days'
             AND s.session_start < c.cohort_date + INTERVAL '31 days'
            THEN c.user_id
        END) AS d30_retained
    FROM cohorts c
    LEFT JOIN telemetry_sessions s ON c.user_id = s.user_id
    WHERE c.cohort_date >= NOW() - INTERVAL '90 days'
      AND c.cohort_date < NOW() - INTERVAL '31 days'  -- Allow time for D30 return
    GROUP BY c.cohort_date
)
SELECT
    cohort_date,
    cohort_size,
    d30_retained,
    ROUND((d30_retained::NUMERIC / cohort_size::NUMERIC) * 100, 2) AS d30_retention_pct
FROM day30_returns
ORDER BY cohort_date DESC;

-- =============================================================================
-- 5. FTUE COMPLETION RATE
-- =============================================================================
-- First-time user experience completion
-- Target: 75%, Warning: 70%, Critical: 65%

SELECT
    DATE_TRUNC('day', created_at)::DATE AS day,
    COUNT(*) AS new_users,
    COUNT(*) FILTER (WHERE ftue_completed = TRUE) AS ftue_completed_count,
    ROUND(
        (COUNT(*) FILTER (WHERE ftue_completed = TRUE)::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
    ) AS ftue_completion_rate_pct
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- 6. SEASON TASK COMPLETION
-- =============================================================================
-- Average season tasks completed per player
-- Target: 60%, Warning: 50%, Critical: 40%

SELECT
    DATE_TRUNC('day', updated_at)::DATE AS day,
    COUNT(DISTINCT user_id) AS active_players,
    AVG(tasks_completed) AS avg_tasks_completed,
    AVG(total_tasks) AS avg_total_tasks,
    ROUND(AVG(tasks_completed::NUMERIC / total_tasks::NUMERIC) * 100, 2) AS avg_completion_pct
FROM liveops_season_progress
WHERE season_id = 'S1'
  AND updated_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- 7. BOSS SUCCESS RATE
-- =============================================================================
-- Boss encounters won vs attempted
-- Target: 45%, Warning: 30%, Critical: 20%

SELECT
    DATE_TRUNC('day', encounter_time)::DATE AS day,
    boss_id,
    COUNT(*) AS total_attempts,
    COUNT(*) FILTER (WHERE result = 'success') AS successful_attempts,
    ROUND(
        (COUNT(*) FILTER (WHERE result = 'success')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
    ) AS success_rate_pct
FROM gameplay_boss_encounters
WHERE encounter_time >= NOW() - INTERVAL '30 days'
GROUP BY day, boss_id
ORDER BY day DESC, boss_id;

-- Overall boss success rate (all bosses)
SELECT
    DATE_TRUNC('day', encounter_time)::DATE AS day,
    COUNT(*) AS total_attempts,
    COUNT(*) FILTER (WHERE result = 'success') AS successful_attempts,
    ROUND(
        (COUNT(*) FILTER (WHERE result = 'success')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
    ) AS overall_success_rate_pct
FROM gameplay_boss_encounters
WHERE encounter_time >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- 8. NPS (Net Promoter Score)
-- =============================================================================
-- In-game player satisfaction survey
-- Target: 50, Warning: 40, Critical: 30

-- Calculate NPS from survey responses (0-10 scale)
-- Promoters: 9-10, Passives: 7-8, Detractors: 0-6
WITH nps_buckets AS (
    SELECT
        DATE_TRUNC('day', submitted_at)::DATE AS day,
        CASE
            WHEN score >= 9 THEN 'promoter'
            WHEN score >= 7 THEN 'passive'
            ELSE 'detractor'
        END AS bucket,
        COUNT(*) AS count
    FROM surveys_nps
    WHERE submitted_at >= NOW() - INTERVAL '30 days'
      AND score IS NOT NULL
    GROUP BY day, bucket
)
SELECT
    day,
    SUM(CASE WHEN bucket = 'promoter' THEN count ELSE 0 END) AS promoters,
    SUM(CASE WHEN bucket = 'passive' THEN count ELSE 0 END) AS passives,
    SUM(CASE WHEN bucket = 'detractor' THEN count ELSE 0 END) AS detractors,
    SUM(count) AS total_responses,
    ROUND(
        (
            (SUM(CASE WHEN bucket = 'promoter' THEN count ELSE 0 END)::NUMERIC / SUM(count)::NUMERIC) -
            (SUM(CASE WHEN bucket = 'detractor' THEN count ELSE 0 END)::NUMERIC / SUM(count)::NUMERIC)
        ) * 100,
        0
    ) AS nps_score
FROM nps_buckets
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- 9. SESSION DURATION
-- =============================================================================
-- Average session length

SELECT
    DATE_TRUNC('day', session_start)::DATE AS day,
    COUNT(*) AS session_count,
    AVG(EXTRACT(EPOCH FROM (session_end - session_start)) / 60) AS avg_session_minutes,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (session_end - session_start)) / 60) AS median_session_minutes,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (session_end - session_start)) / 60) AS p95_session_minutes
FROM telemetry_sessions
WHERE session_start >= NOW() - INTERVAL '30 days'
  AND session_end IS NOT NULL
  AND session_end > session_start
  AND EXTRACT(EPOCH FROM (session_end - session_start)) < 28800  -- Filter 8h+ sessions
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- ALERT QUERIES
-- =============================================================================

-- Check retention and engagement metrics against thresholds
WITH latest_metrics AS (
    -- D1 Retention
    SELECT
        'd1_retention' AS metric,
        ROUND(
            (COUNT(DISTINCT CASE
                WHEN s.session_start >= u.created_at + INTERVAL '1 day'
                 AND s.session_start < u.created_at + INTERVAL '2 days'
                THEN u.user_id
            END)::NUMERIC / COUNT(DISTINCT u.user_id)::NUMERIC) * 100,
            2
        ) AS current_value,
        30.0 AS critical_threshold
    FROM users u
    LEFT JOIN telemetry_sessions s ON u.user_id = s.user_id
    WHERE u.created_at >= NOW() - INTERVAL '3 days'
      AND u.created_at < NOW() - INTERVAL '2 days'

    UNION ALL

    -- FTUE Completion
    SELECT
        'ftue_completion' AS metric,
        ROUND(
            (COUNT(*) FILTER (WHERE ftue_completed = TRUE)::NUMERIC / COUNT(*)::NUMERIC) * 100,
            2
        ) AS current_value,
        65.0 AS critical_threshold
    FROM users
    WHERE created_at >= NOW() - INTERVAL '7 days'
)
SELECT
    metric,
    current_value,
    critical_threshold,
    CASE
        WHEN current_value < critical_threshold THEN 'ALERT'
        ELSE 'OK'
    END AS status
FROM latest_metrics
WHERE current_value < critical_threshold;
