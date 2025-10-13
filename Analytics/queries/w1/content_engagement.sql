-- S2 Week 1: Content Engagement Metrics
-- Purpose: Track storm puzzle completion, boss success, co-op adoption
-- Date Range: 2026-01-15 to 2026-01-21 (Week 1)
-- Note: Boss event starts Week 2 (Jan 22), so boss metrics will be NULL for W1

-- Storm Puzzle Completion
WITH storm_puzzles AS (
    SELECT
        DATE(completed_at) as metric_date,
        puzzle_type,
        COUNT(*) as attempts,
        SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completions,
        ROUND(SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as completion_rate_pct,
        AVG(CASE WHEN completed = TRUE THEN time_to_complete_sec ELSE NULL END) as avg_completion_time_sec
    FROM puzzle_attempts
    WHERE season_id = 'S2'
      AND puzzle_category = 'storm'
      AND completed_at >= '2026-01-15 00:00:00'
      AND completed_at < '2026-01-22 00:00:00'
    GROUP BY DATE(completed_at), puzzle_type
),

-- Aggregate Storm Puzzle Metrics
storm_puzzles_agg AS (
    SELECT
        metric_date,
        SUM(attempts) as total_attempts,
        SUM(completions) as total_completions,
        ROUND(SUM(completions) * 100.0 / SUM(attempts), 2) as overall_completion_rate_pct
    FROM storm_puzzles
    GROUP BY metric_date
),

-- Storm Puzzle by Type
storm_puzzles_by_type AS (
    SELECT
        metric_date,
        MAX(CASE WHEN puzzle_type = 'frequency_align' THEN completion_rate_pct ELSE NULL END) as freq_align_completion_pct,
        MAX(CASE WHEN puzzle_type = 'phase_chain' THEN completion_rate_pct ELSE NULL END) as phase_chain_completion_pct,
        MAX(CASE WHEN puzzle_type = 'echo_triangulation' THEN completion_rate_pct ELSE NULL END) as echo_tri_completion_pct
    FROM storm_puzzles
    GROUP BY metric_date
),

-- Biome Exploration
biome_exploration AS (
    SELECT
        DATE(visited_at) as metric_date,
        biome_name,
        COUNT(DISTINCT user_id) as unique_visitors,
        AVG(time_spent_sec) as avg_time_spent_sec
    FROM biome_visits
    WHERE season_id = 'S2'
      AND biome_name IN ('canyon_night_storm', 'ruins_sand_gale')
      AND visited_at >= '2026-01-15 00:00:00'
      AND visited_at < '2026-01-22 00:00:00'
    GROUP BY DATE(visited_at), biome_name
),

-- Biome Exploration Aggregate
biome_exploration_agg AS (
    SELECT
        metric_date,
        SUM(unique_visitors) as total_biome_visitors,
        MAX(CASE WHEN biome_name = 'canyon_night_storm' THEN unique_visitors ELSE NULL END) as canyon_visitors,
        MAX(CASE WHEN biome_name = 'ruins_sand_gale' THEN unique_visitors ELSE NULL END) as ruins_visitors
    FROM biome_exploration
    GROUP BY metric_date
),

-- Co-op Adoption (Week 1 baseline, no bonus yet)
coop_adoption AS (
    SELECT
        DATE(session_started_at) as metric_date,
        COUNT(DISTINCT CASE WHEN is_coop = TRUE THEN user_id ELSE NULL END) as coop_users,
        COUNT(DISTINCT user_id) as total_users,
        ROUND(COUNT(DISTINCT CASE WHEN is_coop = TRUE THEN user_id ELSE NULL END) * 100.0 / COUNT(DISTINCT user_id), 2) as coop_adoption_pct
    FROM sessions
    WHERE season_id = 'S2'
      AND session_started_at >= '2026-01-15 00:00:00'
      AND session_started_at < '2026-01-22 00:00:00'
    GROUP BY DATE(session_started_at)
),

-- Boss Attempts (Week 2+, expected NULL for W1)
boss_attempts AS (
    SELECT
        DATE(attempted_at) as metric_date,
        boss_id,
        COUNT(*) as attempts,
        SUM(CASE WHEN defeated = TRUE THEN 1 ELSE 0 END) as defeats,
        ROUND(SUM(CASE WHEN defeated = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate_pct,
        AVG(CASE WHEN defeated = TRUE THEN attempt_number ELSE NULL END) as avg_attempts_to_defeat
    FROM boss_encounters
    WHERE season_id = 'S2'
      AND attempted_at >= '2026-01-15 00:00:00'
      AND attempted_at < '2026-01-22 00:00:00'
    GROUP BY DATE(attempted_at), boss_id
)

-- Final output
SELECT
    spa.metric_date,

    -- Storm Puzzles
    spa.total_attempts as puzzle_attempts,
    spa.total_completions as puzzle_completions,
    spa.overall_completion_rate_pct as puzzle_completion_pct,
    CASE
        WHEN spa.overall_completion_rate_pct < 60 THEN '🟡 BELOW TARGET'
        WHEN spa.overall_completion_rate_pct >= 70 THEN '🟢 ABOVE TARGET'
        ELSE '🟢 ON TARGET'
    END as puzzle_status,

    spbt.freq_align_completion_pct,
    spbt.phase_chain_completion_pct,
    spbt.echo_tri_completion_pct,

    -- Biome Exploration
    bea.canyon_visitors,
    bea.ruins_visitors,

    -- Co-op Adoption
    ca.coop_adoption_pct,
    CASE
        WHEN ca.coop_adoption_pct < 20 THEN '🟡 BELOW BASELINE'
        WHEN ca.coop_adoption_pct >= 25 THEN '🟢 ABOVE BASELINE'
        ELSE '🟢 ON BASELINE'
    END as coop_status,

    -- Boss (expected NULL for W1)
    ba.boss_id,
    ba.attempts as boss_attempts,
    ba.success_rate_pct as boss_success_pct,
    ba.avg_attempts_to_defeat

FROM storm_puzzles_agg spa
LEFT JOIN storm_puzzles_by_type spbt ON spa.metric_date = spbt.metric_date
LEFT JOIN biome_exploration_agg bea ON spa.metric_date = bea.metric_date
LEFT JOIN coop_adoption ca ON spa.metric_date = ca.metric_date
LEFT JOIN boss_attempts ba ON spa.metric_date = ba.metric_date
ORDER BY spa.metric_date;

-- Target KPIs:
-- Storm Puzzle Completion: ≥70%
-- Boss Success Rate: 45-65% (starts Week 2)
-- Co-op Adoption: ≥25% baseline (30% target with Week 4 bonus)
-- Biome Exploration: 80%+ of DAU visit new biomes
