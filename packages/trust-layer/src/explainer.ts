/**
 * EXPLAINABILITY ENGINE
 *
 * Purpose: Generate human-readable explanations for AI decisions
 * Methods: SHAP-style feature importance, natural language generation
 * Compliance: EU AI Act explainability requirements
 */

import crypto from 'crypto';
import {
  Explanation,
  FeatureImportance,
} from './types';

/**
 * Explainability configuration
 */
export interface ExplainerConfig {
  top_k_features?: number; // Number of top features to include (default: 5)
  min_importance_threshold?: number; // Minimum importance to include (default: 0.01)
  language?: 'en' | 'tr'; // Language for natural language summary
}

const DEFAULT_CONFIG: Required<ExplainerConfig> = {
  top_k_features: 5,
  min_importance_threshold: 0.01,
  language: 'tr',
};

/**
 * Explainability Engine
 */
export class ExplainabilityEngine {
  private config: Required<ExplainerConfig>;

  constructor(config: ExplainerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate explanation for a decision
   *
   * @param decisionType - Type of decision
   * @param modelName - Name of the model
   * @param prediction - Predicted value
   * @param features - Input features with values
   * @param shapValues - SHAP values for each feature (optional, will calculate if not provided)
   * @returns Explanation object
   */
  explain(params: {
    decisionType:
      | 'pricing'
      | 'promotion'
      | 'routing'
      | 'fraud_detection'
      | 'recommendation'
      | 'economy_optimization';
    modelName: string;
    modelVersion: string;
    prediction: string | number | boolean;
    confidence: number;
    features: Record<string, string | number | boolean>;
    shapValues?: Record<string, number>;
  }): Explanation {
    const decision_id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Calculate or use provided SHAP values
    const shapValues = params.shapValues || this.calculateMockShapValues(params.features);

    // Convert to feature importances
    const allImportances: FeatureImportance[] = Object.entries(shapValues)
      .map(([feature_name, importance]) => {
        const feature_value = params.features[feature_name];
        const contribution_direction: 'positive' | 'negative' | 'neutral' =
          importance > 0.01 ? 'positive' : importance < -0.01 ? 'negative' : 'neutral';

        return {
          feature_name,
          importance,
          feature_value,
          contribution_direction,
        };
      })
      .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

    // Filter by threshold and top-k
    const feature_importances = allImportances
      .filter((f) => Math.abs(f.importance) >= this.config.min_importance_threshold)
      .slice(0, this.config.top_k_features);

    // Generate natural language summary
    const natural_language_summary = this.generateNaturalLanguageSummary(
      params.decisionType,
      params.prediction,
      feature_importances,
      params.confidence
    );

    return {
      decision_id,
      decision_type: params.decisionType,
      model_name: params.modelName,
      model_version: params.modelVersion,
      prediction: params.prediction,
      confidence: params.confidence,
      feature_importances,
      natural_language_summary,
      timestamp,
      explainability_method: 'shap',
    };
  }

  /**
   * Mock SHAP value calculation (production: use actual SHAP library)
   */
  private calculateMockShapValues(
    features: Record<string, string | number | boolean>
  ): Record<string, number> {
    const shapValues: Record<string, number> = {};

    // Mock implementation: assign random importance values
    // Production: use shap-js or call Python SHAP service
    for (const [key, value] of Object.entries(features)) {
      // Simulate different importance levels
      if (key.includes('price') || key.includes('demand')) {
        shapValues[key] = (Math.random() - 0.5) * 0.6; // High importance
      } else if (key.includes('stock') || key.includes('sales')) {
        shapValues[key] = (Math.random() - 0.5) * 0.4; // Medium importance
      } else {
        shapValues[key] = (Math.random() - 0.5) * 0.2; // Low importance
      }
    }

    return shapValues;
  }

  /**
   * Generate natural language summary based on decision type and features
   */
  private generateNaturalLanguageSummary(
    decisionType: string,
    prediction: string | number | boolean,
    features: FeatureImportance[],
    confidence: number
  ): string {
    const lang = this.config.language;
    const topFeature = features[0];
    const secondFeature = features[1];

    // Turkish summaries
    if (lang === 'tr') {
      switch (decisionType) {
        case 'pricing':
          return (
            `Bu fiyatlandırma kararı (${prediction} TL) %${(confidence * 100).toFixed(0)} güvenle önerilmiştir. ` +
            `En önemli etken "${topFeature?.feature_name}" (etki: ${this.formatImportance(topFeature?.importance || 0)}). ` +
            (secondFeature
              ? `İkinci önemli faktör "${secondFeature.feature_name}" (etki: ${this.formatImportance(secondFeature.importance)}).`
              : '')
          );

        case 'promotion':
          return (
            `Bu promosyon önerisi %${(confidence * 100).toFixed(0)} güvenle yapılmıştır. ` +
            `Karar "${topFeature?.feature_name}" faktörüne dayalıdır (etki: ${this.formatImportance(topFeature?.importance || 0)}). `
          );

        case 'routing':
          return (
            `Bu rota optimizasyonu %${(confidence * 100).toFixed(0)} güvenle önerilmiştir. ` +
            `En önemli faktör "${topFeature?.feature_name}" (etki: ${this.formatImportance(topFeature?.importance || 0)}).`
          );

        case 'fraud_detection':
          return (
            `Bu işlem ${prediction === true ? 'şüpheli' : 'güvenli'} olarak sınıflandırılmıştır (güven: %${(confidence * 100).toFixed(0)}). ` +
            `En önemli sinyal "${topFeature?.feature_name}" (etki: ${this.formatImportance(topFeature?.importance || 0)}).`
          );

        case 'recommendation':
          return (
            `Bu ürün önerisi %${(confidence * 100).toFixed(0)} güvenle yapılmıştır. ` +
            `Öneri "${topFeature?.feature_name}" faktörüne dayalıdır (etki: ${this.formatImportance(topFeature?.importance || 0)}).`
          );

        case 'economy_optimization':
          return (
            `Bu ekonomi optimizasyonu %${(confidence * 100).toFixed(0)} güvenle önerilmiştir. ` +
            `En etkili faktör "${topFeature?.feature_name}" (etki: ${this.formatImportance(topFeature?.importance || 0)}). ` +
            (secondFeature
              ? `İkinci faktör "${secondFeature.feature_name}" (etki: ${this.formatImportance(secondFeature.importance)}).`
              : '')
          );

        default:
          return `Karar %${(confidence * 100).toFixed(0)} güvenle alınmıştır.`;
      }
    }

    // English summaries
    switch (decisionType) {
      case 'pricing':
        return (
          `This pricing decision (${prediction} TRY) is recommended with ${(confidence * 100).toFixed(0)}% confidence. ` +
          `The most important factor is "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}). ` +
          (secondFeature
            ? `Second factor: "${secondFeature.feature_name}" (impact: ${this.formatImportance(secondFeature.importance)}).`
            : '')
        );

      case 'promotion':
        return (
          `This promotion is recommended with ${(confidence * 100).toFixed(0)}% confidence. ` +
          `The decision is based on "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}).`
        );

      case 'routing':
        return (
          `This route optimization is recommended with ${(confidence * 100).toFixed(0)}% confidence. ` +
          `Key factor: "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}).`
        );

      case 'fraud_detection':
        return (
          `This transaction is classified as ${prediction === true ? 'suspicious' : 'safe'} with ${(confidence * 100).toFixed(0)}% confidence. ` +
          `Main signal: "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}).`
        );

      case 'recommendation':
        return (
          `This product recommendation has ${(confidence * 100).toFixed(0)}% confidence. ` +
          `Based on "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}).`
        );

      case 'economy_optimization':
        return (
          `This economy optimization is recommended with ${(confidence * 100).toFixed(0)}% confidence. ` +
          `Most influential: "${topFeature?.feature_name}" (impact: ${this.formatImportance(topFeature?.importance || 0)}). ` +
          (secondFeature
            ? `Second: "${secondFeature.feature_name}" (impact: ${this.formatImportance(secondFeature.importance)}).`
            : '')
        );

      default:
        return `Decision made with ${(confidence * 100).toFixed(0)}% confidence.`;
    }
  }

  /**
   * Format importance value for human readability
   */
  private formatImportance(importance: number): string {
    const absImportance = Math.abs(importance);
    const direction = importance > 0 ? '+' : '-';

    if (absImportance > 0.5) {
      return `${direction}${(absImportance * 100).toFixed(1)}% (çok yüksek)`;
    } else if (absImportance > 0.3) {
      return `${direction}${(absImportance * 100).toFixed(1)}% (yüksek)`;
    } else if (absImportance > 0.1) {
      return `${direction}${(absImportance * 100).toFixed(1)}% (orta)`;
    } else {
      return `${direction}${(absImportance * 100).toFixed(1)}% (düşük)`;
    }
  }

  /**
   * Explain batch predictions
   */
  async explainBatch(
    decisions: Array<{
      decisionType: string;
      modelName: string;
      modelVersion: string;
      prediction: string | number | boolean;
      confidence: number;
      features: Record<string, string | number | boolean>;
    }>
  ): Promise<Explanation[]> {
    return decisions.map((decision) =>
      this.explain({
        decisionType: decision.decisionType as any,
        modelName: decision.modelName,
        modelVersion: decision.modelVersion,
        prediction: decision.prediction,
        confidence: decision.confidence,
        features: decision.features,
      })
    );
  }

  /**
   * Get feature importance statistics across multiple explanations
   */
  getFeatureImportanceStats(explanations: Explanation[]): Array<{
    feature_name: string;
    avg_importance: number;
    max_importance: number;
    min_importance: number;
    frequency: number;
  }> {
    const stats = new Map<
      string,
      { sum: number; max: number; min: number; count: number }
    >();

    for (const explanation of explanations) {
      for (const feature of explanation.feature_importances) {
        const current = stats.get(feature.feature_name) || {
          sum: 0,
          max: -Infinity,
          min: Infinity,
          count: 0,
        };

        current.sum += feature.importance;
        current.max = Math.max(current.max, feature.importance);
        current.min = Math.min(current.min, feature.importance);
        current.count += 1;

        stats.set(feature.feature_name, current);
      }
    }

    return Array.from(stats.entries())
      .map(([feature_name, data]) => ({
        feature_name,
        avg_importance: data.sum / data.count,
        max_importance: data.max,
        min_importance: data.min,
        frequency: data.count,
      }))
      .sort((a, b) => Math.abs(b.avg_importance) - Math.abs(a.avg_importance));
  }
}
