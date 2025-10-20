/**
 * GROQ AI ENHANCER
 *
 * Stratejilere AI desteği sağlar:
 * - Pattern validation
 * - Risk assessment
 * - Confidence boosting
 * - Market sentiment analysis
 *
 * Model: Llama 3.3 70B (Ultra-fast, Free tier: 14,400 req/day)
 * Latency: <1 second
 * Cost: $0 (free tier) or ~$0.50/day (paid)
 */

interface StrategyResult {
  name: string;
  strength: number;
  active: boolean;
  description: string;
}

export interface AIEnhancementResult {
  enhancedConfidence: number; // 0-100
  aiRiskScore: number; // 0-100 (lower is better)
  aiRecommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
  patternAnalysis: string;
  keyInsights: string[];
  confidenceBoost: number; // How much AI adds to base confidence
}

/**
 * Groq API configuration
 */
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Get Groq API key from environment
 */
function getGroqApiKey(): string | null {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GROQ_API_KEY || null;
  }
  return null;
}

/**
 * Call Groq API for AI analysis
 */
async function callGroqAPI(prompt: string): Promise<any> {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    console.warn('[Groq AI] API key not found, skipping AI enhancement');
    return null;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert crypto trading analyst. Analyze technical patterns and provide confidence scores.
Always respond with valid JSON only, no additional text.
Focus on: pattern strength, risk assessment, and actionable insights.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error('[Groq AI] API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[Groq AI] No content in response');
      return null;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('[Groq AI] Error:', error);
    return null;
  }
}

/**
 * Enhance strategy analysis with AI
 */
export async function enhanceWithAI(
  symbol: string,
  baseConfidence: number,
  agreementCount: number,
  totalStrategies: number,
  activeStrategies: StrategyResult[],
  currentPrice: number
): Promise<AIEnhancementResult | null> {
  try {
    // Only use AI if we have some signal (not worth it for 0 strategies)
    if (agreementCount === 0) {
      return null;
    }

    // Prepare analysis prompt
    const strategySummary = activeStrategies.map(s =>
      `${s.name}: ${s.strength}/10 - ${s.description}`
    ).join('\n');

    const prompt = `Analyze this crypto trading signal for ${symbol} at $${currentPrice.toFixed(2)}:

STRATEGY ANALYSIS:
- Agreement: ${agreementCount}/${totalStrategies} strategies
- Base Confidence: ${baseConfidence.toFixed(1)}%
- Active Strategies:
${strategySummary}

Provide JSON response with:
{
  "patternStrength": 0-100,
  "riskScore": 0-100,
  "recommendation": "STRONG_BUY" | "BUY" | "HOLD" | "AVOID",
  "patternAnalysis": "Brief pattern description",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "confidenceAdjustment": -20 to +20
}`;

    const aiResponse = await callGroqAPI(prompt);

    if (!aiResponse) {
      return null;
    }

    // Calculate enhanced confidence
    const confidenceBoost = aiResponse.confidenceAdjustment || 0;
    const enhancedConfidence = Math.max(0, Math.min(100,
      baseConfidence + confidenceBoost
    ));

    return {
      enhancedConfidence,
      aiRiskScore: aiResponse.riskScore || 50,
      aiRecommendation: aiResponse.recommendation || 'HOLD',
      patternAnalysis: aiResponse.patternAnalysis || 'No analysis available',
      keyInsights: aiResponse.keyInsights || [],
      confidenceBoost,
    };
  } catch (error) {
    console.error('[Groq AI] Enhancement error:', error);
    return null;
  }
}

/**
 * Quick sentiment check (faster, for background scanning)
 */
export async function quickSentimentCheck(
  symbol: string,
  strategyCount: number,
  baseConfidence: number
): Promise<number> {
  try {
    // Only use for high-confidence signals
    if (baseConfidence < 60) {
      return 0; // No adjustment
    }

    const prompt = `Quick sentiment check for ${symbol}:
- ${strategyCount} technical strategies agree
- Base confidence: ${baseConfidence}%

Respond with JSON: { "sentimentBoost": -10 to +10 }`;

    const response = await callGroqAPI(prompt);

    if (!response || typeof response.sentimentBoost !== 'number') {
      return 0;
    }

    return Math.max(-10, Math.min(10, response.sentimentBoost));
  } catch (error) {
    console.error('[Groq AI] Sentiment check error:', error);
    return 0;
  }
}

/**
 * Batch sentiment analysis for multiple symbols
 * (More efficient for background scanning)
 */
export async function batchSentimentAnalysis(
  signals: Array<{ symbol: string; confidence: number; strategies: number }>
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  try {
    // Only analyze top signals
    const topSignals = signals
      .filter(s => s.confidence >= 60)
      .slice(0, 5); // Limit to top 5 to save API calls

    if (topSignals.length === 0) {
      return results;
    }

    const prompt = `Quick batch sentiment analysis for these crypto signals:

${topSignals.map((s, i) =>
  `${i + 1}. ${s.symbol}: ${s.strategies} strategies, ${s.confidence}% confidence`
).join('\n')}

Respond with JSON: { "adjustments": { "SYMBOL1": -10 to +10, "SYMBOL2": ... } }`;

    const response = await callGroqAPI(prompt);

    if (response && response.adjustments) {
      for (const [symbol, boost] of Object.entries(response.adjustments)) {
        if (typeof boost === 'number') {
          results.set(symbol, Math.max(-10, Math.min(10, boost)));
        }
      }
    }
  } catch (error) {
    console.error('[Groq AI] Batch sentiment error:', error);
  }

  return results;
}

/**
 * Risk assessment for a potential trade
 */
export async function assessRisk(
  symbol: string,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  confidence: number
): Promise<{
  riskScore: number; // 0-100 (lower is better)
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
} | null> {
  try {
    const riskReward = (takeProfit - entryPrice) / (entryPrice - stopLoss);

    const prompt = `Risk assessment for ${symbol} trade:
- Entry: $${entryPrice.toFixed(2)}
- Stop Loss: $${stopLoss.toFixed(2)} (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(2)}%)
- Take Profit: $${takeProfit.toFixed(2)} (${((takeProfit - entryPrice) / entryPrice * 100).toFixed(2)}%)
- Risk/Reward: ${riskReward.toFixed(2)}:1
- Signal Confidence: ${confidence}%

Respond with JSON: {
  "riskScore": 0-100,
  "riskCategory": "LOW" | "MEDIUM" | "HIGH",
  "recommendation": "brief risk assessment"
}`;

    const response = await callGroqAPI(prompt);

    if (!response) {
      return null;
    }

    return {
      riskScore: response.riskScore || 50,
      riskCategory: response.riskCategory || 'MEDIUM',
      recommendation: response.recommendation || 'Standard risk',
    };
  } catch (error) {
    console.error('[Groq AI] Risk assessment error:', error);
    return null;
  }
}

/**
 * Check if Groq AI is available
 */
export function isGroqAvailable(): boolean {
  return getGroqApiKey() !== null;
}

/**
 * Get AI enhancement status
 */
export function getAIStatus(): {
  available: boolean;
  model: string;
  provider: string;
} {
  return {
    available: isGroqAvailable(),
    model: GROQ_MODEL,
    provider: 'Groq',
  };
}
