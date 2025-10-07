export interface Intent {
  type: IntentType;
  confidence: number;
  metadata?: Record<string, any>;
}

export enum IntentType {
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  CODE_DEBUGGING = 'code_debugging',
  CREATIVE_WRITING = 'creative_writing',
  TECHNICAL_WRITING = 'technical_writing',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  QUESTION_ANSWERING = 'question_answering',
  MATH_REASONING = 'math_reasoning',
  GENERAL_CHAT = 'general_chat',
  DATA_ANALYSIS = 'data_analysis',
  VISION_ANALYSIS = 'vision_analysis',
}

export class IntentInferenceEngine {
  /**
   * Infer user intent from message content using keyword matching and heuristics
   */
  inferIntent(messages: { role: string; content: string }[]): Intent {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop()?.content || '';

    const lowerMessage = lastUserMessage.toLowerCase();

    // Code generation patterns
    if (this.matchesPatterns(lowerMessage, [
      /write.*code|create.*function|implement.*class/i,
      /generate.*script|build.*app|develop/i,
      /código|código|écrire.*code/i,
    ])) {
      return { type: IntentType.CODE_GENERATION, confidence: 0.9, metadata: { messageText: lastUserMessage } };
    }

    // Code review patterns
    if (this.matchesPatterns(lowerMessage, [
      /review.*code|check.*code|analyze.*code/i,
      /bug|error|problem|issue.*code/i,
      /optimize|improve.*code|refactor/i,
    ])) {
      return { type: IntentType.CODE_REVIEW, confidence: 0.85, metadata: { messageText: lastUserMessage } };
    }

    // Debugging patterns
    if (this.matchesPatterns(lowerMessage, [
      /debug|fix.*bug|error.*help/i,
      /not working|doesn't work|broken/i,
      /exception|traceback|stack trace/i,
    ])) {
      return { type: IntentType.CODE_DEBUGGING, confidence: 0.9, metadata: { messageText: lastUserMessage } };
    }

    // Math & reasoning
    if (this.matchesPatterns(lowerMessage, [
      /calculate|solve.*equation|math.*problem/i,
      /\d+\s*[\+\-\*\/\^]\s*\d+/,
      /proof|theorem|logic/i,
    ])) {
      return { type: IntentType.MATH_REASONING, confidence: 0.85, metadata: { messageText: lastUserMessage } };
    }

    // Creative writing
    if (this.matchesPatterns(lowerMessage, [
      /write.*story|create.*poem|compose/i,
      /creative|fiction|narrative/i,
      /screenplay|dialogue|character/i,
    ])) {
      return { type: IntentType.CREATIVE_WRITING, confidence: 0.8, metadata: { messageText: lastUserMessage } };
    }

    // Translation
    if (this.matchesPatterns(lowerMessage, [
      /translate.*to|translation|traduire|traduzir/i,
      /how do you say.*in/i,
      /english.*spanish|french.*german/i,
    ])) {
      return { type: IntentType.TRANSLATION, confidence: 0.95, metadata: { messageText: lastUserMessage } };
    }

    // Summarization
    if (this.matchesPatterns(lowerMessage, [
      /summarize|summary|tldr|tl;dr/i,
      /brief|overview|key points/i,
      /condense|shorten/i,
    ])) {
      return { type: IntentType.SUMMARIZATION, confidence: 0.9, metadata: { messageText: lastUserMessage } };
    }

    // Data analysis
    if (this.matchesPatterns(lowerMessage, [
      /analyze.*data|data.*analysis/i,
      /statistics|statistical|trends/i,
      /dataset|csv|excel/i,
    ])) {
      return { type: IntentType.DATA_ANALYSIS, confidence: 0.85, metadata: { messageText: lastUserMessage } };
    }

    // Question answering (factual)
    if (this.matchesPatterns(lowerMessage, [
      /^what is|^who is|^when did|^where is|^why does/i,
      /explain|define|describe/i,
      /how does.*work|how to/i,
    ])) {
      return { type: IntentType.QUESTION_ANSWERING, confidence: 0.75, metadata: { messageText: lastUserMessage } };
    }

    // Default to general chat
    return {
      type: IntentType.GENERAL_CHAT,
      confidence: 0.6,
      metadata: { messageText: lastUserMessage }
    };
  }

  /**
   * Get recommended model characteristics for an intent
   */
  getRecommendedCharacteristics(intent: Intent): {
    prioritizeCost: boolean;
    prioritizeQuality: boolean;
    prioritizeLatency: boolean;
    requiresReasoning: boolean;
    requiresVision: boolean;
  } {
    switch (intent.type) {
      case IntentType.CODE_GENERATION:
      case IntentType.CODE_REVIEW:
        return {
          prioritizeCost: false,
          prioritizeQuality: true,
          prioritizeLatency: false,
          requiresReasoning: true,
          requiresVision: false,
        };

      case IntentType.CODE_DEBUGGING:
      case IntentType.MATH_REASONING:
        return {
          prioritizeCost: false,
          prioritizeQuality: true,
          prioritizeLatency: false,
          requiresReasoning: true,
          requiresVision: false,
        };

      case IntentType.CREATIVE_WRITING:
        return {
          prioritizeCost: false,
          prioritizeQuality: true,
          prioritizeLatency: false,
          requiresReasoning: false,
          requiresVision: false,
        };

      case IntentType.GENERAL_CHAT:
      case IntentType.TRANSLATION:
      case IntentType.SUMMARIZATION:
        return {
          prioritizeCost: true,
          prioritizeQuality: false,
          prioritizeLatency: true,
          requiresReasoning: false,
          requiresVision: false,
        };

      case IntentType.VISION_ANALYSIS:
        return {
          prioritizeCost: false,
          prioritizeQuality: true,
          prioritizeLatency: false,
          requiresReasoning: false,
          requiresVision: true,
        };

      default:
        return {
          prioritizeCost: true,
          prioritizeQuality: false,
          prioritizeLatency: false,
          requiresReasoning: false,
          requiresVision: false,
        };
    }
  }

  private matchesPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
  }
}
