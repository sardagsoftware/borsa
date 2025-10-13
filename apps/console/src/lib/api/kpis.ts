/**
 * KPIs & Telemetry API Client
 * White-hat: Official metrics endpoints only
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface KPIData {
  timestamp: string;
  season: string;
  technical_health: {
    crash_free_rate: number;
    p95_gpu_frame_time: number;
    hitch_rate: number;
    p95_server_latency: number;
  };
  product_engagement: {
    dau: number;
    retention_d1: number;
    retention_d7: number;
    nps: number;
  };
  economy_health: {
    inflation_index: number;
    earn_spend_ratio: number;
    vendor_usage: number;
    fraud_indicators: number;
  };
  content_engagement: {
    puzzle_completion_rate: number;
    coop_adoption_rate: number;
    boss_success_rate: number | null;
  };
}

/**
 * Get Season 2 KPIs
 */
export async function getSeasonKPIs(season: string = 's2'): Promise<KPIData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/kpis/${season}`, {
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    return null;
  }
}

/**
 * Get alert status
 */
export async function getAlertStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/status`, {
      cache: 'no-store'
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return null;
  }
}

/**
 * Test alert system (requires ops.admin)
 */
export async function testAlert(alertType: string) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_type: alertType })
    });

    return res.ok;
  } catch (error) {
    console.error('Failed to test alert:', error);
    return false;
  }
}
