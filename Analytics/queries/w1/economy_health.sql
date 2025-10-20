-- S2 Week 1: Economy Health Metrics
-- Purpose: Track earn/spend ratio, inflation index, vendor usage, fraud indicators
-- Date Range: 2026-01-15 to 2026-01-21 (Week 1)
-- Alert Thresholds: earn/spend outside 0.9-1.1, inflation >1.08 (warning), >1.15 (critical)

-- Currency Earned vs Spent
WITH currency_flow AS (
    SELECT
        DATE(transaction_timestamp) as metric_date,
        SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END) as total_spent,
        COUNT(DISTINCT user_id) as active_transacting_users
    FROM currency_transactions
    WHERE season_id = 'S2'
      AND currency_code = 'CR'
      AND transaction_timestamp >= '2026-01-15 00:00:00'
      AND transaction_timestamp < '2026-01-22 00:00:00'
    GROUP BY DATE(transaction_timestamp)
),

-- Earn/Spend Ratio
earn_spend_ratio AS (
    SELECT
        metric_date,
        total_earned,
        total_spent,
        CASE
            WHEN total_spent > 0 THEN ROUND(total_earned * 1.0 / total_spent, 3)
            ELSE NULL
        END as earn_spend_ratio
    FROM currency_flow
),

-- Inflation Index (purchasing power relative to baseline)
inflation_index AS (
    SELECT
        DATE(measured_at) as metric_date,
        AVG(player_cr_balance) as avg_balance,
        AVG(vendor_price_index) as avg_vendor_price,
        ROUND(AVG(player_cr_balance) / NULLIF(AVG(vendor_price_index), 0), 3) as purchasing_power,
        ROUND(
            (AVG(player_cr_balance) / NULLIF(AVG(vendor_price_index), 0)) /
            (SELECT AVG(player_cr_balance) / NULLIF(AVG(vendor_price_index), 0)
             FROM economy_snapshots
             WHERE DATE(measured_at) = '2026-01-15'
               AND season_id = 'S2'),
            3
        ) as inflation_index
    FROM economy_snapshots
    WHERE season_id = 'S2'
      AND measured_at >= '2026-01-15 00:00:00'
      AND measured_at < '2026-01-22 00:00:00'
    GROUP BY DATE(measured_at)
),

-- Vendor Usage
vendor_usage AS (
    SELECT
        DATE(transaction_timestamp) as metric_date,
        COUNT(DISTINCT user_id) as vendor_users,
        COUNT(*) as vendor_transactions,
        SUM(amount) as vendor_revenue_cr
    FROM currency_transactions
    WHERE season_id = 'S2'
      AND transaction_type = 'spend'
      AND source = 'vendor'
      AND transaction_timestamp >= '2026-01-15 00:00:00'
      AND transaction_timestamp < '2026-01-22 00:00:00'
    GROUP BY DATE(transaction_timestamp)
),

-- Vendor Usage Rate (% of DAU)
vendor_usage_rate AS (
    SELECT
        vu.metric_date,
        vu.vendor_users,
        dau.daily_active_users,
        ROUND(vu.vendor_users * 100.0 / dau.daily_active_users, 2) as vendor_usage_pct
    FROM vendor_usage vu
    LEFT JOIN (
        SELECT
            DATE(session_started_at) as metric_date,
            COUNT(DISTINCT user_id) as daily_active_users
        FROM sessions
        WHERE season_id = 'S2'
          AND session_started_at >= '2026-01-15 00:00:00'
          AND session_started_at < '2026-01-22 00:00:00'
        GROUP BY DATE(session_started_at)
    ) dau ON vu.metric_date = dau.metric_date
),

-- Fraud Indicators
fraud_indicators AS (
    SELECT
        DATE(detected_at) as metric_date,
        COUNT(*) as fraud_flags,
        SUM(CASE WHEN flag_type = 'earn_rate_anomaly' THEN 1 ELSE 0 END) as earn_rate_anomalies,
        SUM(CASE WHEN flag_type = 'duplication_attempt' THEN 1 ELSE 0 END) as duplication_attempts,
        SUM(CASE WHEN flag_type = 'suspicious_transaction' THEN 1 ELSE 0 END) as suspicious_transactions
    FROM fraud_detection_logs
    WHERE season_id = 'S2'
      AND detected_at >= '2026-01-15 00:00:00'
      AND detected_at < '2026-01-22 00:00:00'
    GROUP BY DATE(detected_at)
)

-- Final output
SELECT
    esr.metric_date,

    esr.total_earned,
    esr.total_spent,
    esr.earn_spend_ratio,
    CASE
        WHEN esr.earn_spend_ratio < 0.85 OR esr.earn_spend_ratio > 1.20 THEN '🔴 CRITICAL'
        WHEN esr.earn_spend_ratio < 0.90 OR esr.earn_spend_ratio > 1.10 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as earn_spend_status,

    ii.inflation_index,
    CASE
        WHEN ii.inflation_index > 1.15 THEN '🔴 CRITICAL'
        WHEN ii.inflation_index > 1.08 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as inflation_status,

    vur.vendor_usage_pct,
    CASE
        WHEN vur.vendor_usage_pct < 30 THEN '🔴 CRITICAL'
        WHEN vur.vendor_usage_pct < 40 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as vendor_status,

    fi.fraud_flags,
    fi.earn_rate_anomalies,
    fi.duplication_attempts,
    fi.suspicious_transactions,
    CASE
        WHEN fi.fraud_flags > 20 THEN '🔴 CRITICAL'
        WHEN fi.fraud_flags > 5 THEN '🟡 WARNING'
        ELSE '🟢 OK'
    END as fraud_status

FROM earn_spend_ratio esr
LEFT JOIN inflation_index ii ON esr.metric_date = ii.metric_date
LEFT JOIN vendor_usage_rate vur ON esr.metric_date = vur.metric_date
LEFT JOIN fraud_indicators fi ON esr.metric_date = fi.metric_date
ORDER BY esr.metric_date;

-- Target KPIs:
-- Earn/Spend Ratio: 0.9 - 1.1
-- Inflation Index: <1.08 (warning), <1.15 (critical)
-- Vendor Usage: ≥40%
-- Fraud Indicators: <5 per day
