/**
 * Thompson Sampling Multi-Armed Bandit
 *
 * For intelligent model selection with exploration-exploitation tradeoff
 * Uses Beta distribution for reward modeling
 */

export interface BanditArm {
  id: string;
  alpha: number; // Success count + 1
  beta: number;  // Failure count + 1
  pulls: number;
  rewards: number;
}

export interface BanditSelection {
  armId: string;
  sampledValue: number;
  expectedReward: number;
}

export class ThompsonSamplingBandit {
  private arms: Map<string, BanditArm> = new Map();

  /**
   * Register a new arm (e.g., a model)
   */
  registerArm(armId: string): void {
    this.arms.set(armId, {
      id: armId,
      alpha: 1, // Prior: Beta(1,1) = Uniform
      beta: 1,
      pulls: 0,
      rewards: 0,
    });
  }

  /**
   * Select arm using Thompson Sampling
   */
  selectArm(context?: any): BanditSelection {
    if (this.arms.size === 0) {
      throw new Error('No arms registered');
    }

    let bestArm: string | null = null;
    let bestSample = -Infinity;

    // Sample from Beta distribution for each arm
    for (const [armId, arm] of this.arms) {
      const sample = this.sampleBeta(arm.alpha, arm.beta);

      if (sample > bestSample) {
        bestSample = sample;
        bestArm = armId;
      }
    }

    const selectedArm = this.arms.get(bestArm!)!;

    return {
      armId: bestArm!,
      sampledValue: bestSample,
      expectedReward: selectedArm.alpha / (selectedArm.alpha + selectedArm.beta),
    };
  }

  /**
   * Update arm after observing reward
   */
  updateArm(armId: string, reward: number): void {
    const arm = this.arms.get(armId);
    if (!arm) throw new Error(`Arm ${armId} not found`);

    arm.pulls++;

    // Binary reward (0 or 1)
    const binaryReward = reward >= 0.7 ? 1 : 0;

    if (binaryReward === 1) {
      arm.alpha += 1; // Success
    } else {
      arm.beta += 1;  // Failure
    }

    arm.rewards += reward;
  }

  /**
   * Get arm statistics
   */
  getArmStats(armId: string): BanditArm | null {
    return this.arms.get(armId) || null;
  }

  /**
   * Get all arms sorted by expected reward
   */
  getRanking(): Array<{ armId: string; expectedReward: number; confidence: number }> {
    return Array.from(this.arms.values())
      .map(arm => ({
        armId: arm.id,
        expectedReward: arm.alpha / (arm.alpha + arm.beta),
        confidence: arm.pulls > 0 ? 1 / Math.sqrt(arm.pulls) : 1,
      }))
      .sort((a, b) => b.expectedReward - a.expectedReward);
  }

  /**
   * Sample from Beta distribution using Gamma approximation
   */
  private sampleBeta(alpha: number, beta: number): number {
    const x = this.sampleGamma(alpha);
    const y = this.sampleGamma(beta);
    return x / (x + y);
  }

  /**
   * Sample from Gamma distribution (Marsaglia & Tsang method)
   */
  private sampleGamma(shape: number, scale: number = 1): number {
    if (shape < 1) {
      // Use rejection method for shape < 1
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.randn();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Generate standard normal random variable (Box-Muller)
   */
  private randn(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
