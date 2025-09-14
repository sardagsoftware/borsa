import Groq from 'groq-sdk';

// Groq AI Configuration
interface GroqConfig {
  apiKey: string;
  models: {
    fast: string;
    smart: string;
    vision: string;
  };
  maxTokens: number;
  temperature: number;
}

// AI Analysis Types
interface MarketAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signals: TradingSignal[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
  keyFactors: string[];
}

interface TradingSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number;
  price: number;
  timeframe: string;
  reasoning: string;
}

interface SecurityAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  anomalies: SecurityAnomaly[];
  recommendations: string[];
  score: number;
}

interface SecurityAnomaly {
  type: string;
  severity: number;
  description: string;
  timestamp: Date;
  mitigation: string;
}

class GroqAIService {
  private groq: Groq;
  private config: GroqConfig;

  constructor() {
    this.config = {
      apiKey: process.env.GROQ_API_KEY || '',
      models: {
        fast: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
        smart: process.env.GROQ_MODEL_SMART || 'llama-3.1-70b-versatile',
        vision: process.env.GROQ_MODEL_VISION || 'llava-v1.5-7b-4096-preview'
      },
      maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.7')
    };

    if (!this.config.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.groq = new Groq({
      apiKey: this.config.apiKey,
    });
  }

  // Market Analysis with Groq AI
  async analyzeMarket(symbol: string, marketData: any): Promise<MarketAnalysis> {
    try {
      const prompt = this.buildMarketAnalysisPrompt(symbol, marketData);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert cryptocurrency trading analyst with deep knowledge of market patterns, technical analysis, and risk management. Provide precise, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.smart,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from Groq AI');

      return JSON.parse(response);
    } catch (error) {
      console.error('Groq Market Analysis Error:', error);
      throw new Error('Failed to analyze market with Groq AI');
    }
  }

  // Real-time Trading Signals
  async generateTradingSignals(symbols: string[], timeframe: string = '1h'): Promise<TradingSignal[]> {
    try {
      const prompt = `
        Analyze the following cryptocurrency symbols for trading opportunities: ${symbols.join(', ')}
        Timeframe: ${timeframe}
        
        Consider:
        - Technical indicators (RSI, MACD, Bollinger Bands)
        - Market sentiment and volume
        - Support/resistance levels
        - Risk/reward ratios
        
        Return a JSON array of trading signals with precise entry/exit points.
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional trading signal generator. Provide specific, actionable trading signals with precise entry points, stop losses, and take profits."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.fast,
        temperature: 0.3, // Lower temperature for more consistent signals
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No trading signals generated');

      const parsed = JSON.parse(response);
      return parsed.signals || [];
    } catch (error) {
      console.error('Groq Trading Signals Error:', error);
      return [];
    }
  }

  // Security Analysis with AI
  async analyzeSecurityThreats(logData: any[], networkTraffic: any[]): Promise<SecurityAnalysis> {
    try {
      const prompt = this.buildSecurityAnalysisPrompt(logData, networkTraffic);

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert specializing in financial trading platform security. Analyze threats, anomalies, and provide actionable security recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.smart,
        temperature: 0.2, // Lower temperature for security analysis
        max_tokens: this.config.maxTokens,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No security analysis generated');

      return JSON.parse(response);
    } catch (error) {
      console.error('Groq Security Analysis Error:', error);
      throw new Error('Failed to analyze security threats');
    }
  }

  // Inter-Exchange Arbitrage Analysis
  async analyzeArbitrage(exchanges: string[], symbol: string): Promise<any> {
    try {
      const prompt = `
        Analyze arbitrage opportunities for ${symbol} across exchanges: ${exchanges.join(', ')}
        
        Consider:
        - Price differences between exchanges
        - Trading volumes and liquidity
        - Transaction fees and withdrawal costs
        - Execution speed and slippage
        - Risk factors and timing
        
        Provide profitable arbitrage opportunities with detailed execution strategy.
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert arbitrage trader with deep knowledge of cryptocurrency exchanges, fees, and execution strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.smart,
        temperature: 0.4,
        max_tokens: 3072,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No arbitrage analysis generated');

      return JSON.parse(response);
    } catch (error) {
      console.error('Groq Arbitrage Analysis Error:', error);
      return { opportunities: [], riskAnalysis: 'Analysis failed' };
    }
  }

  // Trading Assistant Chat
  async chatWithAssistant(message: string, context: any = {}): Promise<string> {
    try {
      const systemPrompt = `
        You are AiLydian, an advanced AI trading assistant for cryptocurrency markets.
        
        You have access to:
        - Real-time market data and analysis
        - Technical and fundamental analysis tools
        - Risk management strategies
        - Portfolio optimization techniques
        
        Current context: ${JSON.stringify(context)}
        
        Provide helpful, accurate, and actionable trading advice while emphasizing risk management.
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        model: this.config.models.fast,
        temperature: this.config.temperature,
        max_tokens: 1024
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I cannot process your request at the moment.';
    } catch (error) {
      console.error('Groq Chat Error:', error);
      return 'I apologize, but there was an error processing your request.';
    }
  }

  // News Sentiment Analysis
  async analyzeNewsSentiment(headlines: string[]): Promise<any> {
    try {
      const prompt = `
        Analyze the sentiment of these cryptocurrency news headlines:
        ${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}
        
        Provide:
        - Overall market sentiment score (-1 to 1)
        - Individual headline sentiment
        - Key themes and market impact
        - Trading implications
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a financial news sentiment analyst. Provide accurate sentiment scores and market impact assessments."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.fast,
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No sentiment analysis generated');

      return JSON.parse(response);
    } catch (error) {
      console.error('Groq Sentiment Analysis Error:', error);
      return { overallSentiment: 0, headlines: [], themes: [] };
    }
  }

  // Risk Assessment
  async assessRisk(portfolio: any, marketConditions: any): Promise<any> {
    try {
      const prompt = `
        Assess the risk profile of this trading portfolio:
        Portfolio: ${JSON.stringify(portfolio)}
        Market Conditions: ${JSON.stringify(marketConditions)}
        
        Provide:
        - Overall risk score (1-10)
        - Risk breakdown by asset
        - Suggested risk mitigation strategies
        - Position sizing recommendations
        - Stop-loss and take-profit levels
      `;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional risk management analyst for trading portfolios. Provide comprehensive risk assessments and mitigation strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.config.models.smart,
        temperature: 0.2,
        max_tokens: 3072,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No risk assessment generated');

      return JSON.parse(response);
    } catch (error) {
      console.error('Groq Risk Assessment Error:', error);
      return { riskScore: 5, recommendations: ['Risk assessment unavailable'] };
    }
  }

  // Helper Methods
  private buildMarketAnalysisPrompt(symbol: string, marketData: any): string {
    return `
      Analyze ${symbol} cryptocurrency with the following market data:
      
      Current Price: $${marketData.price}
      24h Change: ${marketData.change24h}%
      Volume: $${marketData.volume}
      Market Cap: $${marketData.marketCap}
      
      Technical Indicators:
      - RSI: ${marketData.rsi}
      - MACD: ${marketData.macd}
      - Moving Averages: ${JSON.stringify(marketData.movingAverages)}
      
      Recent Price Action: ${JSON.stringify(marketData.priceHistory)}
      
      Provide a comprehensive analysis in JSON format with sentiment, confidence, signals, risk level, recommendation, and key factors.
    `;
  }

  private buildSecurityAnalysisPrompt(logData: any[], networkTraffic: any[]): string {
    return `
      Analyze security data for potential threats:
      
      Recent Log Entries:
      ${logData.slice(0, 10).map(log => `${log.timestamp}: ${log.message}`).join('\n')}
      
      Network Traffic Summary:
      ${networkTraffic.slice(0, 5).map(traffic => `${traffic.source} -> ${traffic.destination}: ${traffic.type}`).join('\n')}
      
      Identify:
      - Unusual patterns or anomalies
      - Potential security threats
      - Recommended actions
      - Threat severity levels
      
      Return comprehensive security analysis in JSON format.
    `;
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: "Respond with 'OK' if you are functioning properly."
          }
        ],
        model: this.config.models.fast,
        max_tokens: 10
      });

      return completion.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      console.error('Groq Health Check Failed:', error);
      return false;
    }
  }

  // Arbitrage Opportunities Detection
  async detectArbitrageOpportunities(
    exchanges: string[], 
    pairs: string[]
  ): Promise<any> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Sen AiLydian'ın arbitraj fırsatlarını tespit eden AI uzmanısın. 
            Verilen borsalar ve trading çiftleri arasında fiyat farklılıklarını analiz et.
            Karlı arbitraj fırsatlarını tespit et ve risk seviyelerini değerlendir.`
          },
          {
            role: "user",
            content: `Exchanges: ${exchanges.join(', ')}
            Trading Pairs: ${pairs.join(', ')}
            
            Bu borsalar arasında arbitraj fırsatlarını analiz et ve JSON formatında döndür:
            {
              "opportunities": [
                {
                  "pair": "BTC/USDT",
                  "buy_exchange": "binance",
                  "sell_exchange": "coinbase", 
                  "price_difference": 150.50,
                  "profit_percentage": 0.35,
                  "risk_level": "low",
                  "recommended": true
                }
              ],
              "total_opportunities": 1,
              "highest_profit": 0.35
            }`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 1000
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No arbitrage analysis received from Groq');
      }

      try {
        return JSON.parse(result);
      } catch (parseError) {
        console.warn('Failed to parse arbitrage JSON, returning raw result');
        return { raw_response: result };
      }
    } catch (error) {
      console.error('Groq arbitrage opportunities error:', error);
      return {
        opportunities: [],
        total_opportunities: 0,
        highest_profit: 0,
        error: 'Failed to detect arbitrage opportunities'
      };
    }
  }
}

// Singleton instance
let groqService: GroqAIService | null = null;

export const getGroqService = (): GroqAIService => {
  if (!groqService) {
    groqService = new GroqAIService();
  }
  return groqService;
};

export default GroqAIService;
export type { MarketAnalysis, TradingSignal, SecurityAnalysis, SecurityAnomaly };
