/**
 * Differential Privacy Engine
 *
 * Implements ε-differential privacy with:
 * - Laplace mechanism for numeric queries
 * - Gaussian mechanism for queries with bounded sensitivity
 * - Privacy budget tracking (ε-accounting)
 * - Composition theorems
 */

export interface PrivacyBudget {
  epsilon: number; // Privacy loss parameter
  delta?: number; // Failure probability (for (ε,δ)-DP)
  spent: number;
  remaining: number;
}

export interface NoiseParameters {
  mechanism: 'laplace' | 'gaussian';
  epsilon: number;
  delta?: number;
  sensitivity: number;
}

export class DifferentialPrivacyEngine {
  private budgets: Map<string, PrivacyBudget> = new Map();

  /**
   * Initialize privacy budget for a user/query
   */
  initBudget(userId: string, epsilon: number, delta?: number): void {
    this.budgets.set(userId, {
      epsilon,
      delta,
      spent: 0,
      remaining: epsilon,
    });
  }

  /**
   * Add Laplace noise to a numeric value
   * Laplace(b) where b = Δf/ε
   */
  addLaplaceNoise(value: number, params: NoiseParameters): number {
    const { epsilon, sensitivity } = params;
    const scale = sensitivity / epsilon;

    // Generate Laplace noise: Laplace(0, b)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return value + noise;
  }

  /**
   * Add Gaussian noise to a numeric value
   * For (ε,δ)-differential privacy
   */
  addGaussianNoise(value: number, params: NoiseParameters): number {
    const { epsilon, delta = 1e-5, sensitivity } = params;

    // σ = sqrt(2 * ln(1.25/δ)) * Δf / ε
    const sigma = Math.sqrt(2 * Math.log(1.25 / delta)) * sensitivity / epsilon;

    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return value + noise;
  }

  /**
   * Apply differential privacy to a count query
   */
  privateCount(
    actualCount: number,
    userId: string,
    epsilon: number = 0.1
  ): { noisyCount: number; budgetRemaining: number } {
    // Check budget
    const budget = this.budgets.get(userId);
    if (budget && budget.remaining < epsilon) {
      throw new Error(`Privacy budget exhausted for user ${userId}`);
    }

    // Sensitivity of count = 1 (adding/removing one record changes count by 1)
    const noisyCount = Math.max(
      0,
      Math.round(
        this.addLaplaceNoise(actualCount, {
          mechanism: 'laplace',
          epsilon,
          sensitivity: 1,
        })
      )
    );

    // Update budget
    if (budget) {
      budget.spent += epsilon;
      budget.remaining -= epsilon;
    }

    return {
      noisyCount,
      budgetRemaining: budget?.remaining ?? Infinity,
    };
  }

  /**
   * Apply differential privacy to a sum query
   */
  privateSum(
    actualSum: number,
    userId: string,
    epsilon: number = 0.1,
    maxValue: number = 1000
  ): { noisySum: number; budgetRemaining: number } {
    const budget = this.budgets.get(userId);
    if (budget && budget.remaining < epsilon) {
      throw new Error(`Privacy budget exhausted for user ${userId}`);
    }

    // Sensitivity = maxValue (adding/removing one record with max value)
    const noisySum = this.addLaplaceNoise(actualSum, {
      mechanism: 'laplace',
      epsilon,
      sensitivity: maxValue,
    });

    if (budget) {
      budget.spent += epsilon;
      budget.remaining -= epsilon;
    }

    return {
      noisySum,
      budgetRemaining: budget?.remaining ?? Infinity,
    };
  }

  /**
   * Apply differential privacy to an average query
   */
  privateAverage(
    actualAvg: number,
    count: number,
    userId: string,
    epsilon: number = 0.1,
    maxValue: number = 1000
  ): { noisyAverage: number; budgetRemaining: number } {
    // Split epsilon between sum and count
    const epsilonSum = epsilon / 2;
    const epsilonCount = epsilon / 2;

    const { noisySum } = this.privateSum(actualAvg * count, userId, epsilonSum, maxValue);
    const { noisyCount, budgetRemaining } = this.privateCount(count, userId, epsilonCount);

    const noisyAverage = noisyCount > 0 ? noisySum / noisyCount : 0;

    return { noisyAverage, budgetRemaining };
  }

  /**
   * Get current privacy budget for a user
   */
  getBudget(userId: string): PrivacyBudget | null {
    return this.budgets.get(userId) || null;
  }

  /**
   * Reset privacy budget (e.g., after time window)
   */
  resetBudget(userId: string): void {
    const budget = this.budgets.get(userId);
    if (budget) {
      budget.spent = 0;
      budget.remaining = budget.epsilon;
    }
  }

  /**
   * Compose multiple queries using basic composition
   * Total ε = Σεᵢ
   */
  composeEpsilon(epsilons: number[]): number {
    return epsilons.reduce((sum, eps) => sum + eps, 0);
  }

  /**
   * Compose using advanced composition (tighter bounds)
   * ε' = √(2k ln(1/δ)) * ε + k * ε * (e^ε - 1)
   */
  advancedCompose(epsilon: number, k: number, delta: number): number {
    const term1 = Math.sqrt(2 * k * Math.log(1 / delta)) * epsilon;
    const term2 = k * epsilon * (Math.exp(epsilon) - 1);
    return term1 + term2;
  }
}
