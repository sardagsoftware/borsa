-- Economy Health Metrics
-- Compatible with PostgreSQL and SQLite
-- Last Updated: 2025-10-12

-- =============================================================================
-- 1. EARN/SPEND RATIO
-- =============================================================================
-- Currency earned vs spent
-- Target: 1.2, Min: 1.0, Max: 1.5

SELECT
    DATE_TRUNC('day', transaction_time)::DATE AS day,
    currency_type,
    SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END) AS total_earned,
    SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END) AS total_spent,
    ROUND(
        SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END)::NUMERIC /
        NULLIF(SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END)::NUMERIC, 0),
        2
    ) AS earn_spend_ratio
FROM economy_transactions
WHERE transaction_time >= NOW() - INTERVAL '30 days'
  AND currency_type IN ('CR', 'AC')
GROUP BY day, currency_type
ORDER BY day DESC, currency_type;

-- SQLite version
-- SELECT
--     DATE(transaction_time) AS day,
--     currency_type,
--     SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END) AS total_earned,
--     SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END) AS total_spent,
--     ROUND(
--         CAST(SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END) AS REAL) /
--         NULLIF(CAST(SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END) AS REAL), 0),
--         2
--     ) AS earn_spend_ratio
-- FROM economy_transactions
-- WHERE transaction_time >= DATE('now', '-30 days')
--   AND currency_type IN ('CR', 'AC')
-- GROUP BY day, currency_type
-- ORDER BY day DESC, currency_type;

-- =============================================================================
-- 2. INFLATION INDEX
-- =============================================================================
-- Currency value stability metric
-- Target: 1.00, Warning: 1.10, Critical: 1.15
-- Formula: current_avg_price / baseline_avg_price

-- Baseline prices (first week of season)
WITH baseline_prices AS (
    SELECT
        item_id,
        AVG(price) AS baseline_price
    FROM economy_vendor_sales
    WHERE sale_time >= '2025-10-20'::DATE
      AND sale_time < '2025-10-27'::DATE
    GROUP BY item_id
),
current_prices AS (
    SELECT
        DATE_TRUNC('day', sale_time)::DATE AS day,
        item_id,
        AVG(price) AS current_price
    FROM economy_vendor_sales
    WHERE sale_time >= NOW() - INTERVAL '7 days'
    GROUP BY day, item_id
)
SELECT
    cp.day,
    COUNT(DISTINCT cp.item_id) AS items_tracked,
    AVG(bp.baseline_price) AS avg_baseline_price,
    AVG(cp.current_price) AS avg_current_price,
    ROUND(AVG(cp.current_price / bp.baseline_price), 2) AS inflation_index
FROM current_prices cp
INNER JOIN baseline_prices bp ON cp.item_id = bp.item_id
WHERE bp.baseline_price > 0
GROUP BY cp.day
ORDER BY cp.day DESC;

-- =============================================================================
-- 3. CURRENCY SUPPLY
-- =============================================================================
-- Total currency in circulation

SELECT
    DATE_TRUNC('day', timestamp)::DATE AS day,
    currency_type,
    SUM(balance) AS total_supply,
    AVG(balance) AS avg_balance,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY balance) AS median_balance,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY balance) AS p95_balance,
    COUNT(*) AS player_count
FROM economy_balances_snapshot
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY day, currency_type
ORDER BY day DESC, currency_type;

-- =============================================================================
-- 4. VENDOR USAGE RATE
-- =============================================================================
-- Players using vendor per day
-- Target: 50%, Warning: 40%, Critical: 30%

WITH daily_active_users AS (
    SELECT
        DATE_TRUNC('day', session_start)::DATE AS day,
        COUNT(DISTINCT user_id) AS dau
    FROM telemetry_sessions
    WHERE session_start >= NOW() - INTERVAL '30 days'
    GROUP BY day
),
vendor_users AS (
    SELECT
        DATE_TRUNC('day', sale_time)::DATE AS day,
        COUNT(DISTINCT user_id) AS vendor_users
    FROM economy_vendor_sales
    WHERE sale_time >= NOW() - INTERVAL '30 days'
    GROUP BY day
)
SELECT
    d.day,
    d.dau,
    COALESCE(v.vendor_users, 0) AS vendor_users,
    ROUND(
        (COALESCE(v.vendor_users, 0)::NUMERIC / d.dau::NUMERIC) * 100,
        2
    ) AS vendor_usage_pct
FROM daily_active_users d
LEFT JOIN vendor_users v ON d.day = v.day
ORDER BY d.day DESC;

-- =============================================================================
-- 5. BLACK MARKET / FRAUD INDICATORS
-- =============================================================================
-- Anomalous transaction patterns
-- Target: 0, Warning: 5, Critical: 20

-- Unusual earn rates (earning way above daily limit)
WITH daily_earns AS (
    SELECT
        DATE_TRUNC('day', transaction_time)::DATE AS day,
        user_id,
        SUM(amount) AS daily_earned
    FROM economy_transactions
    WHERE transaction_type = 'earn'
      AND currency_type = 'CR'
      AND transaction_time >= NOW() - INTERVAL '7 days'
    GROUP BY day, user_id
)
SELECT
    day,
    COUNT(*) AS suspicious_accounts,
    AVG(daily_earned) AS avg_suspicious_earn,
    MAX(daily_earned) AS max_suspicious_earn
FROM daily_earns
WHERE daily_earned > 5000  -- Daily limit
GROUP BY day
ORDER BY day DESC;

-- Impossible transaction velocities (too many transactions too fast)
WITH transaction_velocities AS (
    SELECT
        user_id,
        transaction_time,
        LAG(transaction_time) OVER (PARTITION BY user_id ORDER BY transaction_time) AS prev_transaction_time,
        EXTRACT(EPOCH FROM (
            transaction_time - LAG(transaction_time) OVER (PARTITION BY user_id ORDER BY transaction_time)
        )) AS seconds_between_transactions
    FROM economy_transactions
    WHERE transaction_time >= NOW() - INTERVAL '24 hours'
)
SELECT
    DATE_TRUNC('hour', transaction_time)::DATE AS hour,
    user_id,
    COUNT(*) AS rapid_transactions,
    AVG(seconds_between_transactions) AS avg_seconds_between
FROM transaction_velocities
WHERE seconds_between_transactions < 1.0  -- Less than 1 second between transactions
GROUP BY hour, user_id
ORDER BY hour DESC, rapid_transactions DESC;

-- Currency duplication detection (balance increases without earn transactions)
WITH balance_changes AS (
    SELECT
        user_id,
        currency_type,
        timestamp,
        balance,
        LAG(balance) OVER (PARTITION BY user_id, currency_type ORDER BY timestamp) AS prev_balance
    FROM economy_balances_snapshot
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
),
balance_jumps AS (
    SELECT
        user_id,
        currency_type,
        timestamp,
        balance - prev_balance AS balance_increase
    FROM balance_changes
    WHERE prev_balance IS NOT NULL
      AND balance > prev_balance
),
earned_amounts AS (
    SELECT
        user_id,
        currency_type,
        DATE_TRUNC('hour', transaction_time) AS hour,
        SUM(amount) AS total_earned
    FROM economy_transactions
    WHERE transaction_type = 'earn'
      AND transaction_time >= NOW() - INTERVAL '24 hours'
    GROUP BY user_id, currency_type, hour
)
SELECT
    bj.user_id,
    bj.currency_type,
    DATE_TRUNC('hour', bj.timestamp) AS hour,
    SUM(bj.balance_increase) AS unexplained_increase
FROM balance_jumps bj
LEFT JOIN earned_amounts ea
    ON bj.user_id = ea.user_id
    AND bj.currency_type = ea.currency_type
    AND DATE_TRUNC('hour', bj.timestamp) = ea.hour
WHERE COALESCE(ea.total_earned, 0) = 0  -- No legitimate earn transactions
  AND bj.balance_increase > 100  -- Significant increase
GROUP BY bj.user_id, bj.currency_type, hour
ORDER BY unexplained_increase DESC;

-- =============================================================================
-- 6. ARPPU (Average Revenue Per Paying User)
-- =============================================================================
-- PC/Lydian Store only (cosmetic purchases)

SELECT
    DATE_TRUNC('day', purchase_time)::DATE AS day,
    COUNT(DISTINCT user_id) AS paying_users,
    SUM(amount_usd) AS total_revenue,
    ROUND(SUM(amount_usd) / COUNT(DISTINCT user_id), 2) AS arppu
FROM monetization_lydian_store
WHERE purchase_time >= NOW() - INTERVAL '30 days'
  AND platform = 'pc'
  AND amount_usd > 0
GROUP BY day
ORDER BY day DESC;

-- =============================================================================
-- 7. ATTACH RATE (Cosmetics)
-- =============================================================================
-- Players purchasing cosmetics
-- Target: 15%, Warning: 10%

WITH daily_active_users AS (
    SELECT
        DATE_TRUNC('day', session_start)::DATE AS day,
        COUNT(DISTINCT user_id) AS dau
    FROM telemetry_sessions
    WHERE session_start >= NOW() - INTERVAL '30 days'
    GROUP BY day
),
cosmetic_buyers AS (
    SELECT
        DATE_TRUNC('day', purchase_time)::DATE AS day,
        COUNT(DISTINCT user_id) AS buyers
    FROM monetization_lydian_store
    WHERE purchase_time >= NOW() - INTERVAL '30 days'
      AND item_type = 'cosmetic'
    GROUP BY day
)
SELECT
    d.day,
    d.dau,
    COALESCE(c.buyers, 0) AS cosmetic_buyers,
    ROUND(
        (COALESCE(c.buyers, 0)::NUMERIC / d.dau::NUMERIC) * 100,
        2
    ) AS attach_rate_pct
FROM daily_active_users d
LEFT JOIN cosmetic_buyers c ON d.day = c.day
ORDER BY d.day DESC;

-- =============================================================================
-- 8. TOP SPENDERS ANALYSIS
-- =============================================================================
-- Identify whale players and spending patterns

SELECT
    user_id,
    SUM(amount) AS total_spent_cr,
    COUNT(*) AS transaction_count,
    AVG(amount) AS avg_transaction_amount,
    MIN(transaction_time) AS first_transaction,
    MAX(transaction_time) AS last_transaction
FROM economy_transactions
WHERE transaction_type = 'spend'
  AND currency_type = 'CR'
  AND transaction_time >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_spent_cr DESC
LIMIT 100;

-- =============================================================================
-- 9. DROP RATE VALIDATION
-- =============================================================================
-- Verify actual drop rates match configuration

SELECT
    rarity,
    COUNT(*) AS total_drops,
    ROUND(
        (COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER ())::NUMERIC * 100,
        2
    ) AS actual_drop_rate_pct,
    -- Expected ranges from balance.yaml:
    CASE rarity
        WHEN 'common' THEN '65-75%'
        WHEN 'rare' THEN '20-30%'
        WHEN 'epic' THEN '4-8%'
        WHEN 'legendary' THEN '0.5-1.5%'
    END AS expected_range
FROM gameplay_loot_drops
WHERE drop_time >= NOW() - INTERVAL '7 days'
GROUP BY rarity
ORDER BY
    CASE rarity
        WHEN 'common' THEN 1
        WHEN 'rare' THEN 2
        WHEN 'epic' THEN 3
        WHEN 'legendary' THEN 4
    END;

-- =============================================================================
-- ALERT QUERIES
-- =============================================================================

-- Check economy metrics against thresholds
WITH latest_metrics AS (
    -- Inflation Index
    SELECT
        'inflation_index' AS metric,
        AVG(current_price / baseline_price) AS current_value,
        1.15 AS critical_threshold
    FROM (
        SELECT
            item_id,
            AVG(CASE
                WHEN sale_time >= '2025-10-20'::DATE AND sale_time < '2025-10-27'::DATE
                THEN price
            END) AS baseline_price,
            AVG(CASE
                WHEN sale_time >= NOW() - INTERVAL '7 days'
                THEN price
            END) AS current_price
        FROM economy_vendor_sales
        GROUP BY item_id
    ) prices
    WHERE baseline_price > 0 AND current_price IS NOT NULL

    UNION ALL

    -- Earn/Spend Ratio (too high indicates inflation risk)
    SELECT
        'earn_spend_ratio_high' AS metric,
        SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END)::NUMERIC /
        NULLIF(SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END)::NUMERIC, 0) AS current_value,
        1.5 AS critical_threshold
    FROM economy_transactions
    WHERE transaction_time >= NOW() - INTERVAL '24 hours'
      AND currency_type = 'CR'

    UNION ALL

    -- Earn/Spend Ratio (too low indicates deflation risk)
    SELECT
        'earn_spend_ratio_low' AS metric,
        SUM(CASE WHEN transaction_type = 'earn' THEN amount ELSE 0 END)::NUMERIC /
        NULLIF(SUM(CASE WHEN transaction_type = 'spend' THEN amount ELSE 0 END)::NUMERIC, 0) AS current_value,
        1.0 AS critical_threshold
    FROM economy_transactions
    WHERE transaction_time >= NOW() - INTERVAL '24 hours'
      AND currency_type = 'CR'

    UNION ALL

    -- Black Market Indicators
    SELECT
        'fraud_indicators' AS metric,
        COUNT(DISTINCT user_id)::NUMERIC AS current_value,
        20.0 AS critical_threshold
    FROM economy_transactions
    WHERE transaction_type = 'earn'
      AND currency_type = 'CR'
      AND transaction_time >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('day', transaction_time), user_id
    HAVING SUM(amount) > 5000  -- Daily limit
)
SELECT
    metric,
    ROUND(current_value, 2) AS current_value,
    critical_threshold,
    CASE
        WHEN metric = 'earn_spend_ratio_low' AND current_value < critical_threshold THEN 'ALERT'
        WHEN metric != 'earn_spend_ratio_low' AND current_value > critical_threshold THEN 'ALERT'
        ELSE 'OK'
    END AS status
FROM latest_metrics
WHERE (metric = 'earn_spend_ratio_low' AND current_value < critical_threshold)
   OR (metric != 'earn_spend_ratio_low' AND current_value > critical_threshold);
