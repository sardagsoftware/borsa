/**
 * LiveOps API Client
 * White-hat: Official APIs only, HMAC authentication
 * RBAC: Requires liveops.admin scope
 */

import crypto from 'crypto';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Generate HMAC signature for authenticated requests
 */
function generateHMAC(payload: string, timestamp: string, nonce: string): string {
  const secret = process.env.LIVEOPS_API_SECRET || '';
  const message = `${payload}${timestamp}${nonce}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Fetch with HMAC authentication
 */
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = options.body ? JSON.stringify(options.body) : '';
  const signature = generateHMAC(payload, timestamp, nonce);

  const headers = {
    'Content-Type': 'application/json',
    'X-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    ...options.headers
  };

  return fetch(url, { ...options, headers });
}

/**
 * Get current season data
 */
export async function getCurrentSeason() {
  const res = await fetch(`${API_BASE}/api/liveops/season/current`, {
    cache: 'no-store'
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Get today's events
 */
export async function getTodaysEvents() {
  const res = await fetch(`${API_BASE}/api/liveops/events/today`, {
    cache: 'no-store'
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Trigger event (requires RBAC: liveops.admin)
 */
export async function triggerEvent(eventId: string) {
  return authenticatedFetch(`${API_BASE}/api/liveops/events/trigger`, {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId })
  });
}

/**
 * Get active A/B experiments
 */
export async function getActiveExperiments() {
  const res = await fetch(`${API_BASE}/api/experiments/ab/active`, {
    cache: 'no-store'
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Deploy economy patch (canary → GA)
 */
export async function deployEconomyPatch(patchData: any) {
  return authenticatedFetch(`${API_BASE}/api/economy/rebalance`, {
    method: 'POST',
    body: JSON.stringify(patchData)
  });
}

/**
 * Rollback operation
 */
export async function rollback(type: 'economy' | 'ab_experiment' | 'event', target?: string) {
  return authenticatedFetch(`${API_BASE}/api/liveops/rollback`, {
    method: 'POST',
    body: JSON.stringify({ type, target })
  });
}
