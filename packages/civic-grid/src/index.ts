/**
 * LYDIAN-IQ CIVIC-GRID
 *
 * Purpose: Anonymous aggregate statistics for public sector insights
 * Privacy: Differential Privacy (DP) with epsilon budget management
 * Compliance: KVKK/GDPR Article 89 (public interest), k-anonymity
 *
 * Features:
 * - Price trend analysis (DP-protected)
 * - Return rate aggregates
 * - Logistics bottleneck detection
 * - Regional commerce insights
 *
 * Security: Read-only API, rate-limited, institution authentication required
 */

export * from './types';
export * from './dp-engine';
export * from './aggregator';
export * from './insights-api';

export const VERSION = '1.0.0';
