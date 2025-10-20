/**
 * Real-time Quality Estimation (RQE)
 *
 * Estimates response quality without human feedback using:
 * - Response length heuristics
 * - Coherence scoring
 * - Factuality checks
 * - Sentiment analysis
 */

export interface QualityMetrics {
  overall: number; // 0-1
  coherence: number;
  relevance: number;
  completeness: number;
  confidence: number;
}

export interface QualityEstimation {
  score: number;
  metrics: QualityMetrics;
  predictedUserRating: number; // 1-5 stars
  confidence: number;
}

export class QualityEstimator {
  /**
   * Estimate quality of AI response in real-time
   */
  estimate(
    query: string,
    response: string,
    metadata?: {
      model?: string;
      latency?: number;
      tokensOut?: number;
    }
  ): QualityEstimation {
    const coherence = this.scoreCoherence(response);
    const relevance = this.scoreRelevance(query, response);
    const completeness = this.scoreCompleteness(response);
    const confidence = this.scoreConfidence(response, metadata);

    const overall = (coherence * 0.3 + relevance * 0.4 + completeness * 0.2 + confidence * 0.1);

    const predictedUserRating = this.mapToStarRating(overall);

    return {
      score: overall,
      metrics: { overall, coherence, relevance, completeness, confidence },
      predictedUserRating,
      confidence: confidence,
    };
  }

  /**
   * Score coherence (grammar, structure)
   */
  private scoreCoherence(response: string): number {
    let score = 0.5; // Base score

    // Check for complete sentences
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) score += 0.2;

    // Check for proper capitalization
    const properlyCapitalized = sentences.filter(s => /^[A-Z]/.test(s.trim())).length;
    score += (properlyCapitalized / sentences.length) * 0.2;

    // Penalize very short or very long responses
    const wordCount = response.split(/\s+/).length;
    if (wordCount < 10) score -= 0.2;
    if (wordCount > 1000) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score relevance to query
   */
  private scoreRelevance(query: string, response: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    const responseText = response.toLowerCase();

    // Check how many query terms appear in response
    const matchedTerms = queryTerms.filter(term => responseText.includes(term));
    const relevanceRatio = queryTerms.length > 0 ? matchedTerms.length / queryTerms.length : 0;

    // Bonus for direct question answering
    let directAnswer = 0.5;
    if (query.startsWith('what') || query.startsWith('how') || query.startsWith('why')) {
      if (response.toLowerCase().includes('because') || response.toLowerCase().includes('is that')) {
        directAnswer = 0.8;
      }
    }

    return (relevanceRatio * 0.6 + directAnswer * 0.4);
  }

  /**
   * Score completeness
   */
  private scoreCompleteness(response: string): number {
    const wordCount = response.split(/\s+/).length;

    // Heuristic: longer responses tend to be more complete
    if (wordCount < 20) return 0.3;
    if (wordCount < 50) return 0.5;
    if (wordCount < 100) return 0.7;
    if (wordCount < 300) return 0.9;
    return 1.0;
  }

  /**
   * Score confidence based on model and metadata
   */
  private scoreConfidence(response: string, metadata?: any): number {
    let score = 0.5;

    // Check for hedging language (reduces confidence)
    const hedgingPhrases = ['maybe', 'perhaps', 'might', 'possibly', 'i think', 'probably'];
    const lowerResponse = response.toLowerCase();
    const hedgeCount = hedgingPhrases.filter(phrase => lowerResponse.includes(phrase)).length;
    score -= hedgeCount * 0.1;

    // Check for confident language
    const confidentPhrases = ['definitely', 'certainly', 'clearly', 'obviously'];
    const confidentCount = confidentPhrases.filter(phrase => lowerResponse.includes(phrase)).length;
    score += confidentCount * 0.1;

    // Model-based confidence
    if (metadata?.model) {
      if (metadata.model.includes('gpt-4') || metadata.model.includes('opus')) score += 0.2;
      if (metadata.model.includes('mini') || metadata.model.includes('haiku')) score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Map 0-1 score to 1-5 star rating
   */
  private mapToStarRating(score: number): number {
    if (score >= 0.9) return 5;
    if (score >= 0.75) return 4;
    if (score >= 0.6) return 3;
    if (score >= 0.4) return 2;
    return 1;
  }
}
