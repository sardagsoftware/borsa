import {
  AIAdapter,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from '@ailydian/ai-adapters';
import { IntentInferenceEngine, Intent } from './intent-inference';
import { RoutingContext } from './router';

export interface ModelScore {
  adapter: AIAdapter;
  model: string;
  score: number;
  estimatedCost: number;
  estimatedLatency: number;
  reasoning: string;
}

export class IntelligentRouter {
  private adapters: Map<string, AIAdapter> = new Map();
  private intentEngine: IntentInferenceEngine;
  private modelCache: Map<string, any[]> = new Map();

  constructor() {
    this.intentEngine = new IntentInferenceEngine();
  }

  registerAdapter(adapter: AIAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  async selectBestModel(
    request: AICompletionRequest,
    context: RoutingContext
  ): Promise<{ adapter: AIAdapter; model: string; reasoning: string }> {
    // Infer intent from messages
    const intent = this.intentEngine.inferIntent(request.messages);
    const characteristics = this.intentEngine.getRecommendedCharacteristics(intent);

    // Get all available models
    const allModels = await this.getAllAvailableModels();

    // Score each model
    const scoredModels = allModels.map(({ adapter, model }) =>
      this.scoreModel(adapter, model, intent, characteristics, context)
    );

    // Sort by score (descending)
    scoredModels.sort((a, b) => b.score - a.score);

    // Add randomization among top models for diversity (top 30%)
    const topThreshold = Math.ceil(scoredModels.length * 0.3);
    const topModels = scoredModels.slice(0, Math.max(topThreshold, 3));

    // Use weighted random selection from top models
    const totalScore = topModels.reduce((sum, m) => sum + Math.max(m.score, 0), 0);
    let random = Math.random() * totalScore;
    let selected = topModels[0];

    for (const model of topModels) {
      random -= Math.max(model.score, 0);
      if (random <= 0) {
        selected = model;
        break;
      }
    }

    return {
      adapter: selected.adapter,
      model: selected.model,
      reasoning: selected.reasoning,
    };
  }

  private scoreModel(
    adapter: AIAdapter,
    model: any,
    intent: Intent,
    characteristics: any,
    context: RoutingContext
  ): ModelScore {
    let score = 0;
    let reasoning: string[] = [];

    // Cost scoring (0-25 points)
    if (characteristics.prioritizeCost) {
      const avgCost = (model.costPer1kIn + model.costPer1kOut) / 2;
      if (avgCost === 0) {
        score += 25;
        reasoning.push('free');
      } else if (avgCost < 0.001) {
        score += 23;
        reasoning.push('ultra-cheap');
      } else if (avgCost < 0.5) {
        score += 20;
        reasoning.push('very low cost');
      } else if (avgCost < 2) {
        score += 15;
        reasoning.push('moderate cost');
      } else {
        score += 8;
        reasoning.push('higher cost');
      }
    }

    // Quality scoring (0-35 points)
    if (characteristics.prioritizeQuality) {
      // Multi-factor quality assessment
      const avgCost = (model.costPer1kIn + model.costPer1kOut) / 2;

      // Premium models
      if (model.name.includes('opus') || model.name.includes('o1') || model.name.includes('gpt-4')) {
        score += 35;
        reasoning.push('flagship');
      }
      // Mid-tier quality
      else if (model.name.includes('sonnet') || model.name.includes('gpt-4o') || avgCost > 2) {
        score += 28;
        reasoning.push('high quality');
      }
      // Good quality
      else if (avgCost > 0.5) {
        score += 22;
        reasoning.push('good quality');
      }
      // Budget quality
      else {
        score += 18;
        reasoning.push('budget quality');
      }
    }

    // Latency scoring (0-20 points)
    if (characteristics.prioritizeLatency) {
      if (model.name.toLowerCase().includes('flash') || model.name.toLowerCase().includes('turbo')) {
        score += 20;
        reasoning.push('ultra-fast');
      } else if (model.name.includes('mini') || model.name.includes('haiku')) {
        score += 17;
        reasoning.push('fast');
      } else {
        score += 12;
        reasoning.push('standard speed');
      }
    }

    // Reasoning capability (0-30 points)
    if (characteristics.requiresReasoning) {
      if (
        model.capabilities.includes('reasoning') ||
        model.name.includes('o1') ||
        model.name.includes('opus') ||
        model.name.includes('glm-4')
      ) {
        score += 30;
        reasoning.push('advanced reasoning');
      } else if (model.name.includes('sonnet') || model.name.includes('4o')) {
        score += 25;
        reasoning.push('strong reasoning');
      } else if (model.name.includes('yi-large') || model.capabilities.includes('chat')) {
        score += 18;
        reasoning.push('good reasoning');
      } else {
        score += 10;
        reasoning.push('basic reasoning');
      }
    }

    // Vision capability (required or -100 points)
    if (characteristics.requiresVision) {
      if (model.capabilities.includes('vision') || model.name.includes('vision')) {
        score += 25;
        reasoning.push('vision capable');
      } else {
        score -= 100;
        reasoning.push('no vision');
      }
    }

    // Context window bonus (0-12 points)
    if (model.contextWindow >= 200000) {
      score += 12;
      reasoning.push('mega context');
    } else if (model.contextWindow >= 100000) {
      score += 9;
      reasoning.push('large context');
    } else if (model.contextWindow >= 32000) {
      score += 5;
    }

    // Language-specific capabilities
    const messageText = intent.metadata?.messageText?.toLowerCase() || '';

    // Chinese language bonus
    if (/[\u4e00-\u9fa5]/.test(messageText)) {
      if (model.capabilities.includes('chinese') || adapter.name === 'zhipu' || adapter.name === '01ai') {
        score += 15;
        reasoning.push('chinese-optimized');
      }
    }

    // Code-specific models
    if (intent.type.includes('code')) {
      if (model.capabilities.includes('code') || model.name.includes('code')) {
        score += 12;
        reasoning.push('code-specialized');
      }
    }

    // Provider diversity bonus (encourage using different providers)
    if (adapter.name === 'zhipu' || adapter.name === '01ai') {
      score += 5; // Small bonus for Chinese providers
    } else if (adapter.name === 'mistral') {
      score += 3; // Small bonus for European provider
    }

    // Budget constraints
    if (context.budgetRemaining !== undefined) {
      const avgCost = (model.costPer1kIn + model.costPer1kOut) / 2;
      if (avgCost > context.budgetRemaining) {
        score -= 50;
        reasoning.push('exceeds budget');
      }
    }

    // Estimate cost for typical request (1000 in, 500 out tokens)
    const estimatedCost = (1000 / 1000) * model.costPer1kIn + (500 / 1000) * model.costPer1kOut;

    return {
      adapter,
      model: model.id,
      score,
      estimatedCost,
      estimatedLatency: 1500, // Placeholder
      reasoning: `${adapter.name}/${model.name} (${intent.type}): ${reasoning.join(', ')} [score: ${score}]`,
    };
  }

  private async getAllAvailableModels(): Promise<Array<{ adapter: AIAdapter; model: any }>> {
    const results: Array<{ adapter: AIAdapter; model: any }> = [];

    for (const adapter of this.adapters.values()) {
      const cached = this.modelCache.get(adapter.name);
      let models: any[];

      if (cached) {
        models = cached;
      } else {
        models = await adapter.getAvailableModels();
        this.modelCache.set(adapter.name, models);
      }

      for (const model of models) {
        results.push({ adapter, model });
      }
    }

    return results;
  }
}
