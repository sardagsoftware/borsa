/**
 * Token Estimation & Calculation
 * BPE fallback approximation: ~4 characters ≈ 1 token
 *
 * White-hat: No actual API calls, just estimation
 */

/**
 * Estimate token count from text
 * Uses simple heuristic: 4 characters ≈ 1 token (BPE approximation)
 *
 * @param {string} text - Input text
 * @returns {number} - Estimated token count
 */
function estimateTokens(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Remove excessive whitespace
  const cleanText = text.trim().replace(/\s+/g, ' ');

  // BPE approximation: 4 characters ≈ 1 token
  const estimatedTokens = Math.ceil(cleanText.length / 4);

  return estimatedTokens;
}

/**
 * Calculate cost from token count
 * Default: $0.50 per 1K tokens (adjustable by plan multiplier)
 *
 * @param {number} tokens - Token count
 * @param {number} costPer1K - Cost per 1000 tokens (default: 0.50 USD)
 * @param {number} planMultiplier - Plan-based multiplier (default: 1.0)
 * @returns {number} - Cost in USD
 */
function calculateCost(tokens, costPer1K = 0.50, planMultiplier = 1.0) {
  if (!tokens || tokens <= 0) {
    return 0;
  }

  const baseCost = (tokens / 1000) * costPer1K;
  const finalCost = baseCost * planMultiplier;

  // Round to 6 decimal places (micro-cents precision)
  return Math.round(finalCost * 1000000) / 1000000;
}

/**
 * Get model-specific token costs
 * Returns cost per 1K tokens for different models
 *
 * @param {string} model - Model name
 * @returns {{prompt: number, completion: number}} - Cost per 1K tokens
 */
function getModelCosts(model) {
  const costs = {
    // OpenAI models
    'OX7A3F8D': { prompt: 0.01, completion: 0.03 },
    'OX5C9E2B': { prompt: 0.03, completion: 0.06 },
    'OX1D4A7F': { prompt: 0.0005, completion: 0.0015 },

    // Anthropic models
    'AX4D8C1A': { prompt: 0.015, completion: 0.075 },
    'AX9F7E2B-3-sonnet': { prompt: 0.003, completion: 0.015 },
    'AX2B6E9F': { prompt: 0.00025, completion: 0.00125 },
    'AX9F7E2B-sonnet-4-5': { prompt: 0.003, completion: 0.015 },

    // Google models
    'GE6D8A4F': { prompt: 0.00025, completion: 0.0005 },
    'gemini-ultra': { prompt: 0.0125, completion: 0.0375 },

    // Default (generic)
    'default': { prompt: 0.0005, completion: 0.0015 }
  };

  return costs[model] || costs['default'];
}

/**
 * Calculate combined cost for prompt + completion
 *
 * @param {number} promptTokens - Prompt token count
 * @param {number} completionTokens - Completion token count
 * @param {string} model - Model name
 * @returns {number} - Total cost in USD
 */
function calculateModelCost(promptTokens, completionTokens, model = 'default') {
  const costs = getModelCosts(model);

  const promptCost = (promptTokens / 1000) * costs.prompt;
  const completionCost = (completionTokens / 1000) * costs.completion;

  const totalCost = promptCost + completionCost;

  // Round to 6 decimal places
  return Math.round(totalCost * 1000000) / 1000000;
}

module.exports = {
  estimateTokens,
  calculateCost,
  getModelCosts,
  calculateModelCost
};
