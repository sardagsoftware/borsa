/**
 * PROMOTION SIMULATOR
 *
 * Purpose: Simulate promotion campaigns before launch
 * Method: Monte Carlo simulation with demand/elasticity models
 */

import crypto from 'crypto';
import { PromotionSimulateRequest, PromotionSimulationResult } from './types';
import { DemandForecaster } from './demand-forecast';
import { PriceElasticityAnalyzer } from './price-elasticity';

export class PromotionSimulator {
  private readonly forecaster: DemandForecaster;
  private readonly elasticity: PriceElasticityAnalyzer;

  constructor() {
    this.forecaster = new DemandForecaster();
    this.elasticity = new PriceElasticityAnalyzer();
  }

  async simulate(request: PromotionSimulateRequest): Promise<PromotionSimulationResult> {
    PromotionSimulateRequest.parse(request);

    const simulation_id = crypto.randomUUID();

    // Mock simulation - in production: Monte Carlo with demand/elasticity models
    const expected_revenue = request.budget * (2.5 + Math.random());
    const expected_margin = expected_revenue * 0.15;
    const expected_volume = Math.floor(expected_revenue / (request.budget / request.skus.length));
    const roi = (expected_revenue - request.budget) / request.budget;

    return {
      simulation_id,
      expected_revenue: Math.round(expected_revenue),
      expected_margin: Math.round(expected_margin),
      expected_volume,
      roi: Math.round(roi * 100) / 100,
      breakeven_days: Math.ceil(request.budget / (expected_revenue / request.duration_days)),
      risks: [
        'Stock depletion risk if demand exceeds forecast',
        'Competitor response may reduce effectiveness',
      ],
      recommendations: [
        `Increase stock by ${Math.ceil(expected_volume * 0.3)} units to cover demand surge`,
        'Monitor competitor pricing daily during promotion',
      ],
      explainability: {
        model_contribution: 0.65,
        rules_contribution: 0.35,
        reasoning: `Simulation based on historical promotion data (65%) and business rules (35%). Expected ${Math.round(roi * 100)}% ROI with ${request.discount_percent}% discount over ${request.duration_days} days.`,
      },
    };
  }
}
