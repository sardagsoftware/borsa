/**
 * ECONOMY OPTIMIZER TYPES
 *
 * Type-safe interfaces for economic intelligence operations
 */

import { z } from 'zod';

/**
 * Optimization goals
 */
export const OptimizationGoal = z.enum(['margin', 'volume', 'revenue']);
export type OptimizationGoal = z.infer<typeof OptimizationGoal>;

/**
 * Optimization constraints
 */
export const OptimizationConstraints = z.object({
  min_margin_percent: z.number().min(0).max(100).optional(),
  max_discount_percent: z.number().min(0).max(100).optional(),
  min_stock_level: z.number().int().min(0).optional(),
  max_daily_orders: z.number().int().positive().optional(),
  excluded_skus: z.array(z.string()).optional(),
});
export type OptimizationConstraints = z.infer<typeof OptimizationConstraints>;

/**
 * Economy optimization request
 */
export const EconomyOptimizeRequest = z.object({
  goal: OptimizationGoal,
  constraints: OptimizationConstraints.optional(),
  channels: z.array(z.string()).min(1),
  time_horizon_days: z.number().int().min(1).max(90).default(30),
  include_carbon: z.boolean().default(true),
});
export type EconomyOptimizeRequest = z.infer<typeof EconomyOptimizeRequest>;

/**
 * Demand forecast
 */
export const DemandForecast = z.object({
  sku: z.string(),
  forecast_date: z.string().datetime(),
  predicted_demand: z.number().min(0),
  confidence_interval_lower: z.number().min(0),
  confidence_interval_upper: z.number().min(0),
  model: z.enum(['prophet', 'lightgbm', 'ensemble']),
  mape: z.number().min(0).max(100).optional(), // Mean Absolute Percentage Error
});
export type DemandForecast = z.infer<typeof DemandForecast>;

/**
 * Price elasticity
 */
export const PriceElasticity = z.object({
  sku: z.string(),
  current_price: z.number().positive(),
  elasticity_coefficient: z.number(), // Negative = normal good, Positive = Giffen good
  optimal_price: z.number().positive(),
  expected_volume_change_percent: z.number(),
  expected_revenue_change_percent: z.number(),
  confidence: z.number().min(0).max(1),
  method: z.enum(['bayesian', 'glm', 'regression']),
});
export type PriceElasticity = z.infer<typeof PriceElasticity>;

/**
 * Promotion simulation request
 */
export const PromotionSimulateRequest = z.object({
  budget: z.number().positive(),
  duration_days: z.number().int().min(1).max(30),
  skus: z.array(z.string()).min(1),
  discount_percent: z.number().min(0).max(100),
  channels: z.array(z.string()).min(1),
});
export type PromotionSimulateRequest = z.infer<typeof PromotionSimulateRequest>;

/**
 * Promotion simulation result
 */
export const PromotionSimulationResult = z.object({
  simulation_id: z.string().uuid(),
  expected_revenue: z.number().min(0),
  expected_margin: z.number(),
  expected_volume: z.number().int().min(0),
  roi: z.number(), // Return on Investment
  breakeven_days: z.number().min(0).optional(),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
  explainability: z.object({
    model_contribution: z.number().min(0).max(1),
    rules_contribution: z.number().min(0).max(1),
    reasoning: z.string(),
  }),
});
export type PromotionSimulationResult = z.infer<typeof PromotionSimulationResult>;

/**
 * Route optimization request
 */
export const RouteOptimizeRequest = z.object({
  orders: z.array(z.object({
    order_id: z.string(),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      city: z.string(),
    }),
    weight_kg: z.number().positive(),
    priority: z.enum(['standard', 'express', 'same_day']),
  })).min(1),
  carriers: z.array(z.string()).min(1),
  optimization_goal: z.enum(['cost', 'time', 'carbon', 'balanced']),
});
export type RouteOptimizeRequest = z.infer<typeof RouteOptimizeRequest>;

/**
 * Route optimization result
 */
export const RouteOptimizationResult = z.object({
  routes: z.array(z.object({
    carrier: z.string(),
    orders: z.array(z.string()), // order_ids
    estimated_cost: z.number().min(0),
    estimated_duration_hours: z.number().min(0),
    estimated_carbon_kg: z.number().min(0),
    confidence: z.number().min(0).max(1),
  })),
  total_cost: z.number().min(0),
  total_carbon_kg: z.number().min(0),
  total_duration_hours: z.number().min(0),
  unassigned_orders: z.array(z.string()),
  method: z.enum(['mip', 'greedy', 'genetic', 'hybrid']),
  explainability: z.string(),
});
export type RouteOptimizationResult = z.infer<typeof RouteOptimizationResult>;

/**
 * Carbon estimate
 */
export const CarbonEstimate = z.object({
  shipment_id: z.string(),
  distance_km: z.number().min(0),
  weight_kg: z.number().positive(),
  carrier: z.string(),
  transport_mode: z.enum(['ground', 'air', 'sea', 'rail']),
  carbon_kg: z.number().min(0),
  emission_factor: z.number().min(0), // kg CO2 per ton-km
  green_alternative_available: z.boolean(),
  green_alternative_carbon_kg: z.number().min(0).optional(),
});
export type CarbonEstimate = z.infer<typeof CarbonEstimate>;

/**
 * Economy optimization result
 */
export const EconomyOptimizationResult = z.object({
  optimization_id: z.string().uuid(),
  goal: OptimizationGoal,
  status: z.enum(['simulated', 'approved', 'applied', 'failed']),
  recommendations: z.array(z.object({
    action: z.enum(['price_change', 'promotion', 'stock_reorder', 'route_change']),
    sku: z.string().optional(),
    channel: z.string(),
    current_value: z.number(),
    recommended_value: z.number(),
    expected_impact: z.string(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
  })),
  projected_metrics: z.object({
    revenue_change_percent: z.number(),
    margin_change_percent: z.number(),
    volume_change_percent: z.number(),
    carbon_change_kg: z.number(),
  }),
  risks: z.array(z.string()),
  guardrails_passed: z.boolean(),
  explainability: z.object({
    model_features: z.array(z.object({
      feature: z.string(),
      importance: z.number().min(0).max(1),
    })),
    rule_contributions: z.array(z.object({
      rule: z.string(),
      weight: z.number().min(0).max(1),
    })),
    natural_language_summary: z.string(),
  }),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});
export type EconomyOptimizationResult = z.infer<typeof EconomyOptimizationResult>;

/**
 * Feature store configuration
 */
export interface FeatureStoreConfig {
  duckdb_path: string;
  redis_url: string;
  parquet_dir: string;
  refresh_interval_minutes: number;
}

/**
 * Guardrails configuration
 */
export interface GuardrailsConfig {
  min_margin_percent: number;
  min_stock_threshold: number;
  max_price_change_percent: number;
  max_discount_percent: number;
  require_approval_above_amount: number;
}
