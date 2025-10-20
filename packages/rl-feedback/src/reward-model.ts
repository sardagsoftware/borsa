/**
 * Reward Model for RLHF-lite
 *
 * Estimates quality rewards from user feedback
 * Used to guide model selection and fine-tuning
 */

import { FeedbackSignal, FeedbackType } from './feedback-collector';

export interface RewardEstimation {
  messageId: string;
  estimatedReward: number; // -1 to +1
  confidence: number;      // 0 to 1
  breakdown: {
    explicitReward: number;
    implicitReward: number;
    qualityScore: number;
    latencyPenalty: number;
  };
}

export interface RewardModelConfig {
  explicitWeight: number;    // Weight for explicit feedback (thumbs, ratings)
  implicitWeight: number;    // Weight for implicit signals (copy, regenerate)
  qualityWeight: number;     // Weight for quality heuristics
  latencyThresholdMs: number; // Latency penalty threshold
}

export class RewardModel {
  private config: RewardModelConfig;

  constructor(config?: Partial<RewardModelConfig>) {
    this.config = {
      explicitWeight: config?.explicitWeight ?? 0.5,
      implicitWeight: config?.implicitWeight ?? 0.3,
      qualityWeight: config?.qualityWeight ?? 0.15,
      latencyThresholdMs: config?.latencyThresholdMs ?? 2000,
    };
  }

  /**
   * Estimate reward for a message based on feedback signals
   */
  estimateReward(
    signals: FeedbackSignal[],
    responseLength: number
  ): RewardEstimation {
    if (signals.length === 0) {
      // No feedback yet - return neutral reward
      return {
        messageId: '',
        estimatedReward: 0,
        confidence: 0,
        breakdown: {
          explicitReward: 0,
          implicitReward: 0,
          qualityScore: 0,
          latencyPenalty: 0,
        },
      };
    }

    const messageId = signals[0].messageId;

    // 1. Explicit feedback reward
    const explicitReward = this.calculateExplicitReward(signals);

    // 2. Implicit signal reward
    const implicitReward = this.calculateImplicitReward(signals);

    // 3. Quality heuristics
    const qualityScore = this.calculateQualityScore(signals[0], responseLength);

    // 4. Latency penalty
    const latencyPenalty = this.calculateLatencyPenalty(signals[0].latencyMs);

    // Combine rewards with weights
    const estimatedReward =
      explicitReward * this.config.explicitWeight +
      implicitReward * this.config.implicitWeight +
      qualityScore * this.config.qualityWeight -
      latencyPenalty * 0.05;

    // Confidence based on number of signals
    const confidence = Math.min(1, signals.length / 5); // Max confidence at 5+ signals

    return {
      messageId,
      estimatedReward: Math.max(-1, Math.min(1, estimatedReward)),
      confidence,
      breakdown: {
        explicitReward,
        implicitReward,
        qualityScore,
        latencyPenalty,
      },
    };
  }

  /**
   * Calculate reward from explicit feedback (thumbs, ratings)
   */
  private calculateExplicitReward(signals: FeedbackSignal[]): number {
    const thumbsUp = signals.filter((s) => s.type === FeedbackType.THUMBS_UP).length;
    const thumbsDown = signals.filter((s) => s.type === FeedbackType.THUMBS_DOWN).length;
    const starRatings = signals.filter((s) => s.type === FeedbackType.STAR_RATING);

    // Thumbs up/down: +1 / -1
    if (thumbsUp > 0 || thumbsDown > 0) {
      return thumbsUp > thumbsDown ? +1 : -1;
    }

    // Star rating: map 1-5 to -1 to +1
    if (starRatings.length > 0) {
      const avgRating =
        starRatings.reduce((sum, s) => sum + (s.value || 0), 0) / starRatings.length;
      return (avgRating - 3) / 2; // 1 star = -1, 3 stars = 0, 5 stars = +1
    }

    return 0;
  }

  /**
   * Calculate reward from implicit signals
   */
  private calculateImplicitReward(signals: FeedbackSignal[]): number {
    let reward = 0;

    // Code copied = positive signal
    const copyCount = signals.filter((s) => s.type === FeedbackType.COPY_CODE).length;
    reward += copyCount > 0 ? +0.5 : 0;

    // Response regenerated = negative signal
    const regenerateCount = signals.filter((s) => s.type === FeedbackType.REGENERATE).length;
    reward += regenerateCount > 0 ? -0.8 : 0;

    // Response edited = slightly negative signal
    const editCount = signals.filter((s) => s.type === FeedbackType.EDIT_RESPONSE).length;
    reward += editCount > 0 ? -0.3 : 0;

    // Follow-up questions = neutral to positive
    const followUpCount = signals.filter((s) => s.type === FeedbackType.FOLLOW_UP_QUESTION).length;
    reward += followUpCount * 0.1;

    return Math.max(-1, Math.min(1, reward));
  }

  /**
   * Calculate quality score based on heuristics
   */
  private calculateQualityScore(signal: FeedbackSignal, responseLength: number): number {
    let score = 0;

    // Response length heuristic (100-1000 chars is ideal)
    if (responseLength >= 100 && responseLength <= 1000) {
      score += 0.3;
    } else if (responseLength > 1000 && responseLength <= 2000) {
      score += 0.1;
    } else if (responseLength > 2000) {
      score -= 0.1; // Too verbose
    }

    // Code block detection (for code generation queries)
    const hasCodeBlock = signal.response.includes('```');
    if (hasCodeBlock && signal.query.toLowerCase().includes('code')) {
      score += 0.2;
    }

    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Calculate latency penalty
   */
  private calculateLatencyPenalty(latencyMs: number): number {
    if (latencyMs < this.config.latencyThresholdMs) {
      return 0;
    }

    // Linear penalty: +1s = -0.1 reward
    const excessMs = latencyMs - this.config.latencyThresholdMs;
    return Math.min(1, (excessMs / 1000) * 0.1);
  }

  /**
   * Batch estimate rewards for multiple messages
   */
  batchEstimate(
    signalsByMessage: Map<string, FeedbackSignal[]>,
    responseLengths: Map<string, number>
  ): RewardEstimation[] {
    const results: RewardEstimation[] = [];

    for (const [messageId, signals] of signalsByMessage) {
      const length = responseLengths.get(messageId) || 0;
      const estimation = this.estimateReward(signals, length);
      results.push({ ...estimation, messageId });
    }

    return results;
  }
}
