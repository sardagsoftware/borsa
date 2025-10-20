/**
 * DIFFERENTIAL PRIVACY ENGINE
 *
 * Purpose: Add calibrated noise to queries for (ε, δ)-DP guarantee
 * Mechanisms: Laplace, Gaussian
 * Compliance: Privacy loss accounting, epsilon budget tracking
 */

import crypto from 'crypto';
import { DPParameters } from './types';

export class DifferentialPrivacyEngine {
  /**
   * Add Laplace noise for ε-DP
   *
   * @param value - True value
   * @param epsilon - Privacy budget
   * @param sensitivity - Global sensitivity of query
   * @returns Noisy value
   *
   * Laplace distribution: scale = sensitivity / epsilon
   * PDF: f(x) = (1 / 2b) * exp(-|x| / b)
   */
  addLaplaceNoise(value: number, epsilon: number, sensitivity: number): number {
    const scale = sensitivity / epsilon;

    // Generate Laplace noise
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return value + noise;
  }

  /**
   * Add Gaussian noise for (ε, δ)-DP
   *
   * @param value - True value
   * @param epsilon - Privacy budget
   * @param delta - Failure probability
   * @param sensitivity - Global sensitivity
   * @returns Noisy value
   *
   * Gaussian distribution: σ² = 2 * ln(1.25/δ) * sensitivity² / ε²
   */
  addGaussianNoise(
    value: number,
    epsilon: number,
    delta: number,
    sensitivity: number
  ): number {
    const sigma = Math.sqrt((2 * Math.log(1.25 / delta)) * Math.pow(sensitivity, 2)) / epsilon;

    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return value + noise;
  }

  /**
   * Apply DP to aggregate query
   *
   * @param trueValue - True aggregate value
   * @param params - DP parameters
   * @returns Noisy value with DP guarantee
   */
  applyDP(trueValue: number, params: DPParameters): number {
    DPParameters.parse(params);

    if (params.noise_mechanism === 'laplace') {
      return this.addLaplaceNoise(trueValue, params.epsilon, params.sensitivity);
    } else {
      if (!params.delta) {
        throw new Error('Gaussian mechanism requires delta parameter');
      }
      return this.addGaussianNoise(trueValue, params.epsilon, params.delta, params.sensitivity);
    }
  }

  /**
   * Calculate privacy guarantee description
   */
  getPrivacyGuarantee(params: DPParameters): string {
    if (params.noise_mechanism === 'laplace') {
      return `ε=${params.epsilon}-differential privacy. An attacker cannot determine with confidence > ${Math.round((1 - Math.exp(-params.epsilon)) * 100)}% whether any individual's data was included.`;
    } else {
      return `(ε=${params.epsilon}, δ=${params.delta})-differential privacy. Privacy guarantee holds with probability ${1 - (params.delta || 0)}.`;
    }
  }

  /**
   * Compose privacy budgets (sequential composition)
   *
   * @param epsilons - Array of epsilon values
   * @returns Total epsilon
   *
   * For sequential composition: ε_total = Σ ε_i
   */
  composeEpsilon(epsilons: number[]): number {
    return epsilons.reduce((sum, eps) => sum + eps, 0);
  }

  /**
   * Advanced composition (tighter bound)
   *
   * @param epsilon - Per-query epsilon
   * @param k - Number of queries
   * @param delta - Target delta
   * @returns Composed epsilon
   *
   * Advanced composition theorem: ε_total ≈ ε * sqrt(2k * ln(1/δ)) + k * ε * (e^ε - 1)
   */
  advancedComposition(epsilon: number, k: number, delta: number): number {
    const term1 = epsilon * Math.sqrt(2 * k * Math.log(1 / delta));
    const term2 = k * epsilon * (Math.exp(epsilon) - 1);
    return term1 + term2;
  }
}

/**
 * Default DP parameters (conservative)
 */
export const DEFAULT_DP_PARAMS: DPParameters = {
  epsilon: 1.0, // Good privacy
  sensitivity: 1.0, // Default sensitivity
  noise_mechanism: 'laplace',
};
