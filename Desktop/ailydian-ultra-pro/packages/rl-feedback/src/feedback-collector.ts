/**
 * Production Feedback Collection for Reinforcement Learning
 *
 * Collects implicit and explicit user feedback signals
 * for continuous model improvement
 */

export enum FeedbackType {
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  STAR_RATING = 'star_rating',
  COPY_CODE = 'copy_code',
  REGENERATE = 'regenerate',
  EDIT_RESPONSE = 'edit_response',
  SESSION_LENGTH = 'session_length',
  FOLLOW_UP_QUESTION = 'follow_up_question',
}

export interface FeedbackSignal {
  id: string;
  conversationId: string;
  messageId: string;
  userId: string;

  // Feedback details
  type: FeedbackType;
  value?: number;        // For ratings (1-5 stars)
  implicit: boolean;     // Explicit (thumbs) vs implicit (copy code)

  // Context
  query: string;
  response: string;
  model: string;
  latencyMs: number;
  timestamp: Date;

  // Additional metadata
  metadata?: {
    editedTo?: string;
    sessionDuration?: number;
    followUpCount?: number;
    [key: string]: any;
  };
}

export interface FeedbackAggregation {
  model: string;
  totalFeedback: number;

  // Explicit feedback
  thumbsUp: number;
  thumbsDown: number;
  avgStarRating: number;
  starRatingCount: number;

  // Implicit signals
  copyRate: number;           // % of responses copied
  regenerateRate: number;     // % of responses regenerated
  editRate: number;           // % of responses edited
  avgSessionLength: number;   // Average follow-ups per session

  // Aggregate score (0-1)
  overallScore: number;
}

export class FeedbackCollector {
  private signals: Map<string, FeedbackSignal[]> = new Map();

  /**
   * Record feedback signal
   */
  recordSignal(signal: Omit<FeedbackSignal, 'id'>): FeedbackSignal {
    const fullSignal: FeedbackSignal = {
      id: this.generateId(),
      ...signal,
    };

    const key = signal.model;
    const existing = this.signals.get(key) || [];
    existing.push(fullSignal);
    this.signals.set(key, existing);

    return fullSignal;
  }

  /**
   * Record thumbs up
   */
  thumbsUp(params: {
    conversationId: string;
    messageId: string;
    userId: string;
    query: string;
    response: string;
    model: string;
    latencyMs: number;
  }): FeedbackSignal {
    return this.recordSignal({
      ...params,
      type: FeedbackType.THUMBS_UP,
      implicit: false,
      timestamp: new Date(),
    });
  }

  /**
   * Record thumbs down
   */
  thumbsDown(params: {
    conversationId: string;
    messageId: string;
    userId: string;
    query: string;
    response: string;
    model: string;
    latencyMs: number;
  }): FeedbackSignal {
    return this.recordSignal({
      ...params,
      type: FeedbackType.THUMBS_DOWN,
      implicit: false,
      timestamp: new Date(),
    });
  }

  /**
   * Record star rating
   */
  starRating(
    params: {
      conversationId: string;
      messageId: string;
      userId: string;
      query: string;
      response: string;
      model: string;
      latencyMs: number;
    },
    rating: number
  ): FeedbackSignal {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1-5');
    }

    return this.recordSignal({
      ...params,
      type: FeedbackType.STAR_RATING,
      value: rating,
      implicit: false,
      timestamp: new Date(),
    });
  }

  /**
   * Record implicit signal: code copied
   */
  codeCopied(params: {
    conversationId: string;
    messageId: string;
    userId: string;
    query: string;
    response: string;
    model: string;
    latencyMs: number;
  }): FeedbackSignal {
    return this.recordSignal({
      ...params,
      type: FeedbackType.COPY_CODE,
      implicit: true,
      timestamp: new Date(),
    });
  }

  /**
   * Record implicit signal: response regenerated
   */
  responseRegenerated(params: {
    conversationId: string;
    messageId: string;
    userId: string;
    query: string;
    response: string;
    model: string;
    latencyMs: number;
  }): FeedbackSignal {
    return this.recordSignal({
      ...params,
      type: FeedbackType.REGENERATE,
      implicit: true,
      timestamp: new Date(),
    });
  }

  /**
   * Record implicit signal: response edited
   */
  responseEdited(
    params: {
      conversationId: string;
      messageId: string;
      userId: string;
      query: string;
      response: string;
      model: string;
      latencyMs: number;
    },
    editedTo: string
  ): FeedbackSignal {
    return this.recordSignal({
      ...params,
      type: FeedbackType.EDIT_RESPONSE,
      implicit: true,
      timestamp: new Date(),
      metadata: { editedTo },
    });
  }

  /**
   * Aggregate feedback for a model
   */
  aggregateForModel(model: string): FeedbackAggregation {
    const signals = this.signals.get(model) || [];

    if (signals.length === 0) {
      return {
        model,
        totalFeedback: 0,
        thumbsUp: 0,
        thumbsDown: 0,
        avgStarRating: 0,
        starRatingCount: 0,
        copyRate: 0,
        regenerateRate: 0,
        editRate: 0,
        avgSessionLength: 0,
        overallScore: 0,
      };
    }

    const totalResponses = new Set(signals.map((s) => s.messageId)).size;

    const thumbsUp = signals.filter((s) => s.type === FeedbackType.THUMBS_UP).length;
    const thumbsDown = signals.filter((s) => s.type === FeedbackType.THUMBS_DOWN).length;

    const starRatings = signals.filter((s) => s.type === FeedbackType.STAR_RATING);
    const avgStarRating =
      starRatings.length > 0
        ? starRatings.reduce((sum, s) => sum + (s.value || 0), 0) / starRatings.length
        : 0;

    const copyCount = signals.filter((s) => s.type === FeedbackType.COPY_CODE).length;
    const regenerateCount = signals.filter((s) => s.type === FeedbackType.REGENERATE).length;
    const editCount = signals.filter((s) => s.type === FeedbackType.EDIT_RESPONSE).length;

    const copyRate = totalResponses > 0 ? copyCount / totalResponses : 0;
    const regenerateRate = totalResponses > 0 ? regenerateCount / totalResponses : 0;
    const editRate = totalResponses > 0 ? editCount / totalResponses : 0;

    // Calculate overall score (0-1)
    let score = 0;

    // Explicit feedback (50% weight)
    const explicitScore =
      thumbsUp > 0 || thumbsDown > 0
        ? thumbsUp / (thumbsUp + thumbsDown)
        : avgStarRating > 0
        ? avgStarRating / 5
        : 0.5;

    score += explicitScore * 0.5;

    // Implicit signals (50% weight)
    const implicitScore =
      copyRate * 0.4 -        // Copying = good
      regenerateRate * 0.3 -  // Regenerating = bad
      editRate * 0.1 +        // Editing = slightly bad
      0.5;                    // Baseline

    score += Math.max(0, Math.min(1, implicitScore)) * 0.5;

    return {
      model,
      totalFeedback: signals.length,
      thumbsUp,
      thumbsDown,
      avgStarRating,
      starRatingCount: starRatings.length,
      copyRate,
      regenerateRate,
      editRate,
      avgSessionLength: 0, // TODO: Calculate from session data
      overallScore: Math.max(0, Math.min(1, score)),
    };
  }

  /**
   * Get all aggregations
   */
  getAllAggregations(): FeedbackAggregation[] {
    const models = Array.from(this.signals.keys());
    return models.map((model) => this.aggregateForModel(model));
  }

  /**
   * Get signals for a specific message
   */
  getSignalsForMessage(messageId: string): FeedbackSignal[] {
    const allSignals: FeedbackSignal[] = [];
    for (const signals of this.signals.values()) {
      allSignals.push(...signals.filter((s) => s.messageId === messageId));
    }
    return allSignals;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
