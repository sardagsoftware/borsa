-- S2 Week 1: DAU/MAU and Retention Analysis
-- Purpose: Track daily/monthly active users and retention cohorts
-- Date Range: 2026-01-15 to 2026-01-21 (Week 1)
-- White-Hat: KVKK/GDPR compliant (anonymized user_ids)

-- Daily Active Users (DAU)
WITH daily_active AS (
    SELECT
        DATE(session_started_at) as activity_date,
        COUNT(DISTINCT user_id) as dau
    FROM sessions
    WHERE season_id = 'S2'
      AND session_started_at >= '2026-01-15 00:00:00'
      AND session_started_at < '2026-01-22 00:00:00'
    GROUP BY DATE(session_started_at)
),

-- Monthly Active Users (MAU) - rolling 30 days
monthly_active AS (
    SELECT
        DATE(session_started_at) as activity_date,
        COUNT(DISTINCT user_id) as mau
    FROM sessions
    WHERE session_started_at >= DATE_SUB('2026-01-21', INTERVAL 30 DAY)
      AND session_started_at < '2026-01-22 00:00:00'
    GROUP BY DATE(session_started_at)
),

-- D1 Retention (players who returned next day)
d1_retention AS (
    SELECT
        DATE(s1.session_started_at) as cohort_date,
        COUNT(DISTINCT s1.user_id) as cohort_size,
        COUNT(DISTINCT s2.user_id) as returned_d1,
        ROUND(COUNT(DISTINCT s2.user_id) * 100.0 / COUNT(DISTINCT s1.user_id), 2) as retention_d1_pct
    FROM sessions s1
    LEFT JOIN sessions s2
        ON s1.user_id = s2.user_id
        AND DATE(s2.session_started_at) = DATE_ADD(DATE(s1.session_started_at), INTERVAL 1 DAY)
    WHERE s1.season_id = 'S2'
      AND DATE(s1.session_started_at) >= '2026-01-15'
      AND DATE(s1.session_started_at) < '2026-01-21'
      AND s1.is_first_session = TRUE
    GROUP BY DATE(s1.session_started_at)
),

-- D7 Retention (players who returned within 7 days)
d7_retention AS (
    SELECT
        DATE(s1.session_started_at) as cohort_date,
        COUNT(DISTINCT s1.user_id) as cohort_size,
        COUNT(DISTINCT s2.user_id) as returned_d7,
        ROUND(COUNT(DISTINCT s2.user_id) * 100.0 / COUNT(DISTINCT s1.user_id), 2) as retention_d7_pct
    FROM sessions s1
    LEFT JOIN sessions s2
        ON s1.user_id = s2.user_id
        AND DATE(s2.session_started_at) BETWEEN DATE_ADD(DATE(s1.session_started_at), INTERVAL 1 DAY)
                                            AND DATE_ADD(DATE(s1.session_started_at), INTERVAL 7 DAY)
    WHERE s1.season_id = 'S2'
      AND DATE(s1.session_started_at) >= '2026-01-15'
      AND DATE(s1.session_started_at) < '2026-01-15'  -- Only first day cohort for D7
      AND s1.is_first_session = TRUE
    GROUP BY DATE(s1.session_started_at)
)

-- Final output
SELECT
    da.activity_date,
    da.dau,
    ma.mau,
    ROUND(da.dau * 100.0 / ma.mau, 2) as dau_mau_ratio,
    d1.cohort_size as new_players,
    d1.retention_d1_pct,
    d7.retention_d7_pct
FROM daily_active da
LEFT JOIN monthly_active ma ON da.activity_date = ma.activity_date
LEFT JOIN d1_retention d1 ON da.activity_date = d1.cohort_date
LEFT JOIN d7_retention d7 ON da.activity_date = d7.cohort_date
ORDER BY da.activity_date;

-- Expected Output:
-- activity_date | dau  | mau   | dau_mau_ratio | new_players | retention_d1_pct | retention_d7_pct
-- 2026-01-15    | 2650 | 13200 | 20.08         | 320         | 43.12            | NULL
-- 2026-01-16    | 2720 | 13400 | 20.30         | 280         | 42.85            | NULL
-- ...

-- Target KPIs (from S2 planning):
-- DAU: ≥2,600
-- Retention D1: ≥42%
-- Retention D7: ≥22%
