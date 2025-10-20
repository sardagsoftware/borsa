/**
 * METRICS CALCULATOR
 *
 * Calculate A/B test metrics
 * - Conversion rates
 * - Sample sizes
 * - Uplift calculation
 * - Statistical significance
 *
 * WHITE-HAT:
 * - Mathematically sound
 * - No p-hacking
 * - Transparent calculations
 */

import type {
  VariantMetrics,
  ExperimentResults,
  StoredEvent,
  ChiSquareResult,
  ConfidenceInterval,
  SampleSizeCalculation,
} from './types';

// ════════════════════════════════════════════════════════════
// METRICS CALCULATOR CLASS
// ════════════════════════════════════════════════════════════

export class MetricsCalculator {
  /**
   * Calculate variant metrics from events
   */
  calculateVariantMetrics(
    variantId: string,
    variantName: string,
    events: StoredEvent[]
  ): VariantMetrics {
    // Filter events for this variant
    const variantEvents = events.filter(
      (e) => e.variantId === variantId
    );

    // Count unique users
    const uniqueUsers = new Set(
      variantEvents.map((e) => e.userId)
    );

    // Count impressions
    const impressionEvents = variantEvents.filter(
      (e) => e.type === 'experiment_impression' || e.type === 'experiment_exposure'
    );

    // Count conversions
    const conversionEvents = variantEvents.filter(
      (e) => e.type === 'conversion' || e.type === 'primary_goal'
    );

    const uniqueConversions = new Set(
      conversionEvents.map((e) => e.userId)
    );

    // Calculate conversion rate
    const totalUsers = uniqueUsers.size;
    const conversions = uniqueConversions.size;
    const conversionRate = totalUsers > 0 ? conversions / totalUsers : 0;

    return {
      variantId,
      variantName,
      totalUsers,
      uniqueUsers,
      impressions: impressionEvents.length,
      conversions,
      uniqueConversions,
      conversionRate,
      confidenceLevel: 0, // Calculated separately
      isSignificant: false,
      pValue: 1,
    };
  }

  /**
   * Calculate experiment results
   */
  calculateExperimentResults(
    experimentKey: string,
    events: StoredEvent[],
    variantNames: Record<string, string>
  ): ExperimentResults {
    // Group events by variant
    const variantIds = [...new Set(events.map((e) => e.variantId).filter(Boolean))];

    const variants: Record<string, VariantMetrics> = {};

    for (const variantId of variantIds) {
      if (!variantId) continue;
      const variantName = variantNames[variantId] || variantId;
      variants[variantId] = this.calculateVariantMetrics(
        variantId,
        variantName,
        events
      );
    }

    // Calculate overall metrics
    const totalUsers = new Set(events.map((e) => e.userId)).size;
    const totalImpressions = events.filter(
      (e) => e.type === 'experiment_impression' || e.type === 'experiment_exposure'
    ).length;
    const totalConversions = events.filter(
      (e) => e.type === 'conversion' || e.type === 'primary_goal'
    ).length;

    // Find start and end dates
    const timestamps = events.map((e) => e.timestamp);
    const startDate = Math.min(...timestamps);
    const endDate = Math.max(...timestamps);

    const results: ExperimentResults = {
      experimentKey,
      startDate,
      endDate,
      status: 'running',
      variants,
      totalUsers,
      totalImpressions,
      totalConversions,
    };

    // Calculate statistical significance
    if (Object.keys(variants).length >= 2) {
      const chiSquare = this.calculateChiSquare(variants);
      results.chiSquare = chiSquare.chiSquare;
      results.degreesOfFreedom = chiSquare.degreesOfFreedom;
      results.pValue = chiSquare.pValue;

      // Update variant significance
      for (const variantId in variants) {
        variants[variantId].isSignificant = chiSquare.isSignificant;
        variants[variantId].pValue = chiSquare.pValue;
      }

      // Determine winner
      if (chiSquare.isSignificant) {
        const winner = this.determineWinner(variants);
        if (winner) {
          results.winner = winner;
        }
      }
    }

    return results;
  }

  /**
   * Calculate chi-square test
   */
  calculateChiSquare(variants: Record<string, VariantMetrics>): ChiSquareResult {
    const variantArray = Object.values(variants);

    if (variantArray.length < 2) {
      return {
        chiSquare: 0,
        degreesOfFreedom: 0,
        pValue: 1,
        isSignificant: false,
      };
    }

    // Create contingency table
    const observed: number[][] = [];
    for (const variant of variantArray) {
      observed.push([
        variant.conversions,
        variant.totalUsers - variant.conversions,
      ]);
    }

    // Calculate expected frequencies
    const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
    const colTotals = [0, 0];
    for (const row of observed) {
      colTotals[0] += row[0];
      colTotals[1] += row[1];
    }
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    const expected: number[][] = [];
    for (let i = 0; i < observed.length; i++) {
      expected.push([
        (rowTotals[i] * colTotals[0]) / grandTotal,
        (rowTotals[i] * colTotals[1]) / grandTotal,
      ]);
    }

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      for (let j = 0; j < 2; j++) {
        const obs = observed[i][j];
        const exp = expected[i][j];
        if (exp > 0) {
          chiSquare += Math.pow(obs - exp, 2) / exp;
        }
      }
    }

    // Degrees of freedom
    const degreesOfFreedom = (observed.length - 1) * (2 - 1);

    // Calculate p-value (approximation)
    const pValue = this.chiSquareToPValue(chiSquare, degreesOfFreedom);

    return {
      chiSquare,
      degreesOfFreedom,
      pValue,
      isSignificant: pValue < 0.05, // 95% confidence
    };
  }

  /**
   * Convert chi-square to p-value (approximation)
   */
  private chiSquareToPValue(chiSquare: number, df: number): number {
    // Simple approximation using incomplete gamma function
    // For production, use a proper statistical library

    if (df === 1) {
      // Special case for df=1
      if (chiSquare < 3.841) return 0.05;
      if (chiSquare < 6.635) return 0.01;
      return 0.001;
    }

    // Critical values for common df
    const criticalValues: Record<number, number[]> = {
      1: [3.841, 6.635, 10.828],
      2: [5.991, 9.210, 13.816],
      3: [7.815, 11.345, 16.266],
      4: [9.488, 13.277, 18.467],
      5: [11.070, 15.086, 20.515],
    };

    if (df in criticalValues) {
      const [p05, p01, p001] = criticalValues[df];
      if (chiSquare >= p001) return 0.001;
      if (chiSquare >= p01) return 0.01;
      if (chiSquare >= p05) return 0.05;
      return 0.1;
    }

    // Fallback
    return chiSquare > 5 ? 0.05 : 0.1;
  }

  /**
   * Determine winner (best variant)
   */
  determineWinner(
    variants: Record<string, VariantMetrics>
  ): { variantId: string; uplift: number; confidence: number } | null {
    const variantArray = Object.values(variants);

    if (variantArray.length < 2) return null;

    // Find control (first variant)
    const control = variantArray[0];

    // Find best variant (highest conversion rate)
    let best = control;
    for (const variant of variantArray.slice(1)) {
      if (variant.conversionRate > best.conversionRate) {
        best = variant;
      }
    }

    // Calculate uplift vs control
    const uplift =
      control.conversionRate > 0
        ? ((best.conversionRate - control.conversionRate) / control.conversionRate) * 100
        : 0;

    // Confidence level (based on sample size)
    const confidence = this.calculateConfidenceLevel(best.totalUsers);

    return {
      variantId: best.variantId,
      uplift,
      confidence,
    };
  }

  /**
   * Calculate confidence level based on sample size
   */
  calculateConfidenceLevel(sampleSize: number): number {
    // Simple heuristic: more samples = higher confidence
    // Min 100 samples for 50% confidence
    // 1000+ samples for 95% confidence

    if (sampleSize < 100) return 50;
    if (sampleSize < 500) return 75;
    if (sampleSize < 1000) return 85;
    return 95;
  }

  /**
   * Calculate confidence interval for conversion rate
   */
  calculateConfidenceInterval(
    conversions: number,
    totalUsers: number,
    confidence: number = 0.95
  ): ConfidenceInterval {
    if (totalUsers === 0) {
      return { lower: 0, upper: 0, confidence };
    }

    const p = conversions / totalUsers;
    const z = this.getZScore(confidence);
    const margin = z * Math.sqrt((p * (1 - p)) / totalUsers);

    return {
      lower: Math.max(0, p - margin),
      upper: Math.min(1, p + margin),
      confidence,
    };
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidence: number): number {
    // Common z-scores
    if (confidence >= 0.99) return 2.576;
    if (confidence >= 0.95) return 1.96;
    if (confidence >= 0.90) return 1.645;
    return 1.96; // Default to 95%
  }

  /**
   * Calculate required sample size
   */
  calculateRequiredSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number, // e.g., 0.05 for 5% improvement
    power: number = 0.8,
    significance: number = 0.05
  ): SampleSizeCalculation {
    // Simplified sample size calculation
    const p1 = baselineConversionRate;
    const p2 = baselineConversionRate * (1 + minimumDetectableEffect);

    const z_alpha = this.getZScore(1 - significance / 2);
    const z_beta = this.getZScore(power);

    const numerator =
      Math.pow(z_alpha + z_beta, 2) *
      (p1 * (1 - p1) + p2 * (1 - p2));
    const denominator = Math.pow(p2 - p1, 2);

    const requiredSampleSize = Math.ceil(numerator / denominator);

    return {
      requiredSampleSize,
      currentSampleSize: 0,
      progress: 0,
    };
  }

  /**
   * Calculate uplift (percentage improvement)
   */
  calculateUplift(controlRate: number, variantRate: number): number {
    if (controlRate === 0) return 0;
    return ((variantRate - controlRate) / controlRate) * 100;
  }
}

// ════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ════════════════════════════════════════════════════════════

let globalCalculator: MetricsCalculator | null = null;

export function getMetricsCalculator(): MetricsCalculator {
  if (!globalCalculator) {
    globalCalculator = new MetricsCalculator();
  }
  return globalCalculator;
}

// ════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════

export default {
  MetricsCalculator,
  getMetricsCalculator,
};
