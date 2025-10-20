/**
 * CIVIC-GRID TYPES
 *
 * Type-safe interfaces for anonymous aggregate statistics
 */

import { z } from 'zod';

/**
 * Differential Privacy parameters
 */
export const DPParameters = z.object({
  epsilon: z.number().min(0.1).max(10.0), // Privacy budget (lower = more private)
  delta: z.number().min(0).max(0.01).optional(), // Failure probability
  sensitivity: z.number().positive(), // Global sensitivity of query
  noise_mechanism: z.enum(['laplace', 'gaussian']).default('laplace'),
});
export type DPParameters = z.infer<typeof DPParameters>;

/**
 * Insights query request
 */
export const InsightsQueryRequest = z.object({
  metric: z.enum(['price_trend', 'return_rate', 'logistics_bottleneck', 'sales_volume']),
  region: z.string().optional(), // City or province
  sector: z.enum(['electronics', 'fashion', 'food', 'health', 'general']).optional(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  dp_epsilon: z.number().min(0.1).max(5.0).default(1.0),
});
export type InsightsQueryRequest = z.infer<typeof InsightsQueryRequest>;

/**
 * Price trend insight
 */
export const PriceTrendInsight = z.object({
  metric: z.literal('price_trend'),
  region: z.string().optional(),
  sector: z.string().optional(),
  data_points: z.array(z.object({
    date: z.string().datetime(),
    avg_price: z.number().min(0),
    price_change_percent: z.number(),
    dp_noise_added: z.boolean(),
  })),
  dp_parameters: DPParameters,
  privacy_guarantee: z.string(), // Human-readable privacy guarantee
  data_quality: z.enum(['high', 'medium', 'low']), // Based on k-anonymity
});
export type PriceTrendInsight = z.infer<typeof PriceTrendInsight>;

/**
 * Return rate insight
 */
export const ReturnRateInsight = z.object({
  metric: z.literal('return_rate'),
  region: z.string().optional(),
  sector: z.string().optional(),
  return_rate_percent: z.number().min(0).max(100),
  total_orders: z.number().int().min(0),
  dp_noise_added: z.boolean(),
  dp_parameters: DPParameters,
  k_anonymity: z.number().int().min(1), // Minimum group size
  suppressed: z.boolean(), // True if < k threshold
});
export type ReturnRateInsight = z.infer<typeof ReturnRateInsight>;

/**
 * Logistics bottleneck insight
 */
export const LogisticsBottleneckInsight = z.object({
  metric: z.literal('logistics_bottleneck'),
  region: z.string(),
  bottlenecks: z.array(z.object({
    area: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    avg_delay_hours: z.number().min(0),
    affected_shipments_percent: z.number().min(0).max(100),
  })),
  dp_parameters: DPParameters,
  privacy_guarantee: z.string(),
});
export type LogisticsBottleneckInsight = z.infer<typeof LogisticsBottleneckInsight>;

/**
 * Institution API key
 */
export const InstitutionApiKey = z.object({
  key_id: z.string().uuid(),
  institution_name: z.string(),
  institution_type: z.enum(['government', 'research', 'ngo']),
  allowed_metrics: z.array(z.string()),
  rate_limit_per_day: z.number().int().positive(),
  epsilon_budget_per_day: z.number().min(0).max(50.0),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
});
export type InstitutionApiKey = z.infer<typeof InstitutionApiKey>;

/**
 * DP budget tracker
 */
export interface DPBudgetTracker {
  institution_key_id: string;
  date: string; // YYYY-MM-DD
  epsilon_consumed: number;
  queries_count: number;
  remaining_epsilon: number;
}

/**
 * K-anonymity configuration
 */
export interface KAnonymityConfig {
  k: number; // Minimum group size (default: 5)
  suppress_below_k: boolean; // Suppress results with < k records
  generalization_levels: Record<string, string[]>; // Hierarchy for generalization
}
