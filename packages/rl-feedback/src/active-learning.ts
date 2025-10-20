/**
 * Active Learning Engine
 *
 * Identifies high-value examples for human labeling
 * Prioritizes uncertain or important cases
 */

import { FeedbackSignal } from './feedback-collector';
import { RewardEstimation } from './reward-model';

export interface LabelingCandidate {
  messageId: string;
  conversationId: string;
  query: string;
  response: string;
  model: string;

  // Prioritization
  priority: number;        // 0-1 (higher = more valuable)
  reason: string;          // Why this example is valuable

  // Context
  uncertaintyScore: number;
  disagreementScore: number;
  importanceScore: number;
}

export interface ActiveLearningConfig {
  uncertaintyWeight: number;
  disagreementWeight: number;
  importanceWeight: number;
  minSignalsForUncertainty: number;
}

export class ActiveLearningEngine {
  private config: ActiveLearningConfig;

  constructor(config?: Partial<ActiveLearningConfig>) {
    this.config = {
      uncertaintyWeight: config?.uncertaintyWeight ?? 0.4,
      disagreementWeight: config?.disagreementWeight ?? 0.35,
      importanceWeight: config?.importanceWeight ?? 0.25,
      minSignalsForUncertainty: config?.minSignalsForUncertainty ?? 2,
    };
  }

  /**
   * Identify high-value examples for human labeling
   */
  identifyCandidates(
    signals: FeedbackSignal[],
    rewards: RewardEstimation[]
  ): LabelingCandidate[] {
    const candidates: LabelingCandidate[] = [];

    // Group signals by message
    const signalsByMessage = new Map<string, FeedbackSignal[]>();
    for (const signal of signals) {
      const existing = signalsByMessage.get(signal.messageId) || [];
      existing.push(signal);
      signalsByMessage.set(signal.messageId, existing);
    }

    // Create reward lookup
    const rewardByMessage = new Map<string, RewardEstimation>();
    for (const reward of rewards) {
      rewardByMessage.set(reward.messageId, reward);
    }

    // Evaluate each message
    for (const [messageId, msgSignals] of signalsByMessage) {
      const reward = rewardByMessage.get(messageId);
      if (!reward || msgSignals.length === 0) continue;

      const uncertaintyScore = this.calculateUncertainty(reward, msgSignals);
      const disagreementScore = this.calculateDisagreement(msgSignals);
      const importanceScore = this.calculateImportance(msgSignals);

      // Overall priority
      const priority =
        uncertaintyScore * this.config.uncertaintyWeight +
        disagreementScore * this.config.disagreementWeight +
        importanceScore * this.config.importanceWeight;

      // Determine reason
      let reason = '';
      if (uncertaintyScore > 0.7) {
        reason = 'High uncertainty in reward estimation';
      } else if (disagreementScore > 0.7) {
        reason = 'Conflicting user feedback signals';
      } else if (importanceScore > 0.7) {
        reason = 'High-impact query type';
      } else {
        reason = 'Borderline quality, needs human review';
      }

      candidates.push({
        messageId,
        conversationId: msgSignals[0].conversationId,
        query: msgSignals[0].query,
        response: msgSignals[0].response,
        model: msgSignals[0].model,
        priority,
        reason,
        uncertaintyScore,
        disagreementScore,
        importanceScore,
      });
    }

    // Sort by priority (descending)
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates;
  }

  /**
   * Calculate uncertainty score (low confidence in reward)
   */
  private calculateUncertainty(
    reward: RewardEstimation,
    signals: FeedbackSignal[]
  ): number {
    // Low confidence = high uncertainty
    if (signals.length < this.config.minSignalsForUncertainty) {
      return 0.8; // Very uncertain with few signals
    }

    const uncertainty = 1 - reward.confidence;

    // Also consider if reward is near decision boundary (0)
    const nearBoundary = 1 - Math.abs(reward.estimatedReward);

    return (uncertainty * 0.6 + nearBoundary * 0.4);
  }

  /**
   * Calculate disagreement score (conflicting feedback)
   */
  private calculateDisagreement(signals: FeedbackSignal[]): number {
    // Count positive and negative signals
    let positive = 0;
    let negative = 0;

    for (const signal of signals) {
      if (signal.type === 'thumbs_up' || signal.type === 'copy_code') {
        positive++;
      }
      if (signal.type === 'thumbs_down' || signal.type === 'regenerate' || signal.type === 'edit_response') {
        negative++;
      }
      if (signal.type === 'star_rating') {
        const value = signal.value || 3;
        if (value >= 4) positive++;
        if (value <= 2) negative++;
      }
    }

    if (positive === 0 && negative === 0) return 0;

    // High disagreement if roughly equal positive/negative
    const total = positive + negative;
    const balance = Math.min(positive, negative) / total;

    return balance * 2; // 0.5 balance → 1.0 disagreement
  }

  /**
   * Calculate importance score (high-value queries)
   */
  private calculateImportance(signals: FeedbackSignal[]): number {
    if (signals.length === 0) return 0;

    const query = signals[0].query.toLowerCase();
    let score = 0;

    // Long, detailed queries are more important
    if (query.length > 200) score += 0.3;

    // Technical/complex queries
    const technicalKeywords = [
      'implement', 'algorithm', 'optimize', 'debug', 'architecture',
      'security', 'performance', 'scalability', 'distributed',
    ];
    const hasTechnical = technicalKeywords.some((kw) => query.includes(kw));
    if (hasTechnical) score += 0.4;

    // Queries with code blocks
    if (signals[0].response.includes('```')) score += 0.2;

    // High latency queries (user waited long)
    if (signals[0].latencyMs > 3000) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Get top N candidates for labeling
   */
  getTopCandidates(
    signals: FeedbackSignal[],
    rewards: RewardEstimation[],
    topN: number = 10
  ): LabelingCandidate[] {
    const all = this.identifyCandidates(signals, rewards);
    return all.slice(0, topN);
  }

  /**
   * Filter candidates by minimum priority
   */
  filterByPriority(
    candidates: LabelingCandidate[],
    minPriority: number
  ): LabelingCandidate[] {
    return candidates.filter((c) => c.priority >= minPriority);
  }
}
