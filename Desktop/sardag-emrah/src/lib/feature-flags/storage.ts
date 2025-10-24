/**
 * FEATURE FLAGS STORAGE
 *
 * Persistence layer for feature flags
 * - localStorage for overrides
 * - Cookie for user assignments
 * - Session storage for temporary flags
 *
 * WHITE-HAT:
 * - User consent respected
 * - Data stays local
 * - No external tracking
 */

import type { FlagOverride, UserAssignment } from './types';

// ════════════════════════════════════════════════════════════
// STORAGE KEYS
// ════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  OVERRIDES: 'ukalai_flag_overrides',
  ASSIGNMENTS: 'ukalai_user_assignments',
  USER_ID: 'ukalai_user_id',
  SESSION_ID: 'ukalai_session_id',
} as const;

// ════════════════════════════════════════════════════════════
// USER ID MANAGEMENT
// ════════════════════════════════════════════════════════════

/**
 * Generate stable user ID (persists across sessions)
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server';

  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  if (!userId) {
    // Generate new user ID (timestamp + random)
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }

  return userId;
}

/**
 * Generate session ID (new per session)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }

  return sessionId;
}

/**
 * Get user hash (for consistent percentage-based rollout)
 * Returns 0-99
 */
export function getUserHash(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

// ════════════════════════════════════════════════════════════
// OVERRIDES STORAGE
// ════════════════════════════════════════════════════════════

/**
 * Save flag override
 */
export function saveOverride(override: FlagOverride): void {
  if (typeof window === 'undefined') return;

  try {
    const overrides = getOverrides();
    overrides[override.key] = override;

    localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(overrides));
    console.log('[FeatureFlags] Override saved:', override.key);
  } catch (error) {
    console.error('[FeatureFlags] Failed to save override:', error);
  }
}

/**
 * Get all overrides
 */
export function getOverrides(): Record<string, FlagOverride> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.OVERRIDES);
    if (!stored) return {};

    const overrides = JSON.parse(stored) as Record<string, FlagOverride>;

    // Filter out expired overrides
    const now = Date.now();
    const active: Record<string, FlagOverride> = {};

    for (const [key, override] of Object.entries(overrides)) {
      if (!override.expiresAt || override.expiresAt > now) {
        active[key] = override;
      }
    }

    // Save back if any were filtered
    if (Object.keys(active).length !== Object.keys(overrides).length) {
      localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(active));
    }

    return active;
  } catch (error) {
    console.error('[FeatureFlags] Failed to get overrides:', error);
    return {};
  }
}

/**
 * Get specific override
 */
export function getOverride(key: string): FlagOverride | null {
  const overrides = getOverrides();
  return overrides[key] || null;
}

/**
 * Remove override
 */
export function removeOverride(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    const overrides = getOverrides();
    delete overrides[key];

    localStorage.setItem(STORAGE_KEYS.OVERRIDES, JSON.stringify(overrides));
    console.log('[FeatureFlags] Override removed:', key);
  } catch (error) {
    console.error('[FeatureFlags] Failed to remove override:', error);
  }
}

/**
 * Clear all overrides
 */
export function clearOverrides(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.OVERRIDES);
    console.log('[FeatureFlags] All overrides cleared');
  } catch (error) {
    console.error('[FeatureFlags] Failed to clear overrides:', error);
  }
}

// ════════════════════════════════════════════════════════════
// USER ASSIGNMENTS STORAGE
// ════════════════════════════════════════════════════════════

/**
 * Save user assignment (A/B test variant)
 */
export function saveAssignment(assignment: UserAssignment): void {
  if (typeof window === 'undefined') return;

  try {
    const assignments = getAssignments();
    const key = `${assignment.experimentKey}_${assignment.userId}`;
    assignments[key] = assignment;

    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    console.log('[FeatureFlags] Assignment saved:', assignment.experimentKey, '→', assignment.variantId);
  } catch (error) {
    console.error('[FeatureFlags] Failed to save assignment:', error);
  }
}

/**
 * Get all assignments
 */
export function getAssignments(): Record<string, UserAssignment> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[FeatureFlags] Failed to get assignments:', error);
    return {};
  }
}

/**
 * Get assignment for experiment
 */
export function getAssignment(experimentKey: string, userId: string): UserAssignment | null {
  const assignments = getAssignments();
  const key = `${experimentKey}_${userId}`;
  return assignments[key] || null;
}

/**
 * Clear all assignments
 */
export function clearAssignments(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    console.log('[FeatureFlags] All assignments cleared');
  } catch (error) {
    console.error('[FeatureFlags] Failed to clear assignments:', error);
  }
}

// ════════════════════════════════════════════════════════════
// COOKIE UTILITIES (for SSR/cross-tab sync)
// ════════════════════════════════════════════════════════════

/**
 * Set cookie
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const nameEQ = name + '=';
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  // User ID
  getUserId,
  getSessionId,
  getUserHash,

  // Overrides
  saveOverride,
  getOverrides,
  getOverride,
  removeOverride,
  clearOverrides,

  // Assignments
  saveAssignment,
  getAssignments,
  getAssignment,
  clearAssignments,

  // Cookies
  setCookie,
  getCookie,
  deleteCookie,
};
