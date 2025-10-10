/**
 * LYDIAN-IQ COMPANION — FEDERATED LEARNING ORCHESTRATOR
 *
 * Privacy-preserving distributed machine learning
 */

import crypto from 'crypto';
import { z } from 'zod';

// FL Round Schema
export const FLRoundSchema = z.object({
  round_id: z.string().uuid(),
  model_version: z.string(),
  started_at: z.string(),
  ends_at: z.string(),
  target_participants: z.number().min(10),
  actual_participants: z.number().default(0),
  status: z.enum(['scheduled', 'active', 'aggregating', 'completed', 'failed']),
  epsilon: z.number().min(0).max(10).default(1.0), // DP budget
});

export type FLRound = z.infer<typeof FLRoundSchema>;

// Client Update Schema
export const ClientUpdateSchema = z.object({
  client_id: z.string(),
  round_id: z.string().uuid(),
  model_weights: z.array(z.number()), // Encrypted or DP-noised
  num_samples: z.number().min(1),
  loss: z.number(),
  timestamp: z.string(),
});

export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;

// FL Aggregation Strategy
export type AggregationStrategy = 'fedavg' | 'fedprox' | 'scaffold';

export class FederatedLearningOrchestrator {
  private rounds: Map<string, FLRound> = new Map();
  private updates: Map<string, ClientUpdate[]> = new Map();

  /**
   * Start a new FL round
   */
  async startRound(
    model_version: string,
    target_participants: number = 50,
    duration_minutes: number = 60,
    epsilon: number = 1.0
  ): Promise<FLRound> {
    const round_id = crypto.randomUUID();
    const started_at = new Date();
    const ends_at = new Date(started_at.getTime() + duration_minutes * 60 * 1000);

    const round: FLRound = {
      round_id,
      model_version,
      started_at: started_at.toISOString(),
      ends_at: ends_at.toISOString(),
      target_participants,
      actual_participants: 0,
      status: 'active',
      epsilon,
    };

    this.rounds.set(round_id, round);
    this.updates.set(round_id, []);

    return round;
  }

  /**
   * Submit a client update (with differential privacy)
   */
  async submitUpdate(update: ClientUpdate): Promise<{ accepted: boolean; message: string }> {
    const validated = ClientUpdateSchema.parse(update);

    const round = this.rounds.get(validated.round_id);
    if (!round) {
      return { accepted: false, message: 'Round not found' };
    }

    if (round.status !== 'active') {
      return { accepted: false, message: 'Round is not active' };
    }

    // Check if round has ended
    if (new Date() > new Date(round.ends_at)) {
      round.status = 'aggregating';
      this.rounds.set(round.round_id, round);
      return { accepted: false, message: 'Round has ended' };
    }

    // Add DP noise to weights (Gaussian mechanism)
    const noisedWeights = this.addDPNoise(validated.model_weights, round.epsilon, 1.0);
    const noisedUpdate = { ...validated, model_weights: noisedWeights };

    // Store update
    const roundUpdates = this.updates.get(validated.round_id) || [];
    roundUpdates.push(noisedUpdate);
    this.updates.set(validated.round_id, roundUpdates);

    // Update participant count
    round.actual_participants = roundUpdates.length;
    this.rounds.set(round.round_id, round);

    return { accepted: true, message: 'Update accepted' };
  }

  /**
   * Aggregate updates using Federated Averaging
   */
  async aggregateRound(
    round_id: string,
    strategy: AggregationStrategy = 'fedavg'
  ): Promise<{ aggregated_weights: number[]; participants: number }> {
    const round = this.rounds.get(round_id);
    if (!round) {
      throw new Error('Round not found');
    }

    const updates = this.updates.get(round_id) || [];
    if (updates.length === 0) {
      throw new Error('No updates to aggregate');
    }

    // FedAvg: Weighted average by number of samples
    const totalSamples = updates.reduce((sum, u) => sum + u.num_samples, 0);
    const numWeights = updates[0].model_weights.length;

    const aggregated_weights = new Array(numWeights).fill(0);

    for (const update of updates) {
      const weight = update.num_samples / totalSamples;
      for (let i = 0; i < numWeights; i++) {
        aggregated_weights[i] += update.model_weights[i] * weight;
      }
    }

    // Update round status
    round.status = 'completed';
    this.rounds.set(round_id, round);

    return {
      aggregated_weights,
      participants: updates.length,
    };
  }

  /**
   * Add Gaussian noise for differential privacy
   */
  private addDPNoise(weights: number[], epsilon: number, sensitivity: number): number[] {
    const sigma = Math.sqrt(2 * Math.log(1.25 / 0.00001)) * sensitivity / epsilon;

    return weights.map(w => {
      // Box-Muller transform for Gaussian noise
      const u1 = Math.random();
      const u2 = Math.random();
      const noise = sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return w + noise;
    });
  }

  /**
   * Get round status
   */
  async getRoundStatus(round_id: string): Promise<FLRound | null> {
    return this.rounds.get(round_id) || null;
  }

  /**
   * Get all active rounds
   */
  async getActiveRounds(): Promise<FLRound[]> {
    return Array.from(this.rounds.values()).filter(r => r.status === 'active');
  }

  /**
   * Calculate privacy budget consumed
   */
  calculatePrivacyBudget(rounds: FLRound[]): { total_epsilon: number; rounds_count: number } {
    const total_epsilon = rounds.reduce((sum, r) => sum + r.epsilon, 0);
    return { total_epsilon, rounds_count: rounds.length };
  }
}
