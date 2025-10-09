/**
 * LYDIAN-IQ ECONOMY OPTIMIZER
 *
 * Purpose: AI-powered economic intelligence for e-commerce platforms
 * Compliance: KVKK/GDPR - aggregated data only, 7-day retention
 *
 * Features:
 * - Demand forecasting (Prophet/LightGBM)
 * - Price elasticity modeling (Bayesian/GLM)
 * - Promotion simulation
 * - Route/logistics optimization (MIP/heuristics)
 * - Carbon footprint estimation
 *
 * Security: White-hat only, no scraping, approved APIs only
 */

export * from './types';
export * from './demand-forecast';
export * from './price-elasticity';
export * from './promotion-simulator';
export * from './route-optimizer';
export * from './carbon-model';
export * from './optimizer';

export const VERSION = '1.0.0';
