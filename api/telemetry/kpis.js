/**
 * Telemetry KPI Export Endpoint
 * GET /telemetry/kpis
 * Returns current KPI snapshot
 */

const db = require('../../lib/db-connection-secure');

module.exports = async (req, res) => {
  try {
    // In production, these would come from actual database queries
    // For now, return mock data with real structure

    const kpis = {
      timestamp: new Date().toISOString(),
      season: 'S1',

      // Technical Health
      technical_health: {
        crash_free_rate: 98.7,
        p95_gpu_frame_time: 15.8,
        hitch_rate: 1.9,
        p95_server_latency: 142
      },

      // Product Engagement
      product_engagement: {
        dau: 2450,
        mau: 12300,
        dau_mau_ratio: 19.9,
        retention_d1: 42.3,
        retention_d7: 21.5,
        retention_d30: 11.2,
        ftue_completion: 76.8,
        season_task_completion: 62.4,
        boss_success_rate: 44.7,
        nps: 52
      },

      // Economy Health
      economy_health: {
        earn_spend_ratio: 1.18,
        inflation_index: 1.04,
        vendor_usage: 51.2,
        fraud_indicators: 2,
        arppu: 9.45,
        attach_rate: 16.3
      },

      // A/B Experiments (if active)
      experiments: {
        'abx-xp-curve-s1': {
          status: 'running',
          days_remaining: 8,
          control_rate: 0.45,
          variant_rate: 0.52,
          p_value: 0.032,
          significant: true
        },
        'abx-trial-rewards': {
          status: 'running',
          days_remaining: 8,
          control_rate: 0.68,
          variant_rate: 0.73,
          p_value: 0.089,
          significant: false
        }
      },

      // Alerts (if any thresholds violated)
      alerts: [],

      // System status
      status: 'healthy'
    };

    // Check thresholds and add alerts
    if (kpis.technical_health.crash_free_rate < 98.5) {
      kpis.alerts.push({
        severity: 'warning',
        metric: 'crash_free_rate',
        message: 'Crash-free rate below target (98.5%)',
        value: kpis.technical_health.crash_free_rate
      });
    }

    if (kpis.economy_health.inflation_index > 1.10) {
      kpis.alerts.push({
        severity: 'warning',
        metric: 'inflation_index',
        message: 'Inflation index above warning threshold (1.10)',
        value: kpis.economy_health.inflation_index
      });
    }

    if (kpis.alerts.length > 0) {
      kpis.status = 'warning';
    }

    res.json(kpis);

  } catch (error) {
    console.error('[KPI Export Error]', error);
    res.status(500).json({
      error: 'Failed to export KPIs',
      message: error.message
    });
  }
};
