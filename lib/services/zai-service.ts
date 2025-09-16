/**
 * Z.AI GLM-4.5 Service - Advanced AI Analysis for Trading
 * Güvenli ve hızlı AI analiz motoru with encryption support
 */

import { encryptAPIKey, decryptAPIKey, maskAPIKey, createAuditLog } from '@/lib/utils/encryption';

interface ZAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ZAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MarketAnalysis {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;
  reasoning: string;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
}

interface PortfolioAnalysis {
  total_value: number;
  risk_score: number;
  diversification: number;
  recommendations: Array<{
    action: string;
    symbol: string;
    percentage: number;
    reason: string;
  }>;
}

class ZAIService {
  private apiKey: string;
  private baseUrl = 'https://api.z.ai/api/paas/v4';
  private model = 'glm-4.5';
  private requestCount = 0;
  private rateLimitWindow = 60000; // 1 minute
  private maxRequestsPerWindow = 60;
  private lastWindowReset = Date.now();
  
  constructor(apiKey?: string) {
    this.initializeAPIKey(apiKey);
  }

  private initializeAPIKey(providedKey?: string) {
    try {
      // Priority: provided key > encrypted env > plain env
      if (providedKey) {
        this.apiKey = providedKey;
      } else if (process.env.ZAI_API_KEY_ENCRYPTED) {
        this.apiKey = decryptAPIKey(process.env.ZAI_API_KEY_ENCRYPTED);
        console.log(`✅ Z.AI API key loaded: ${maskAPIKey(this.apiKey)}`);
      } else if (process.env.ZAI_API_KEY) {
        this.apiKey = process.env.ZAI_API_KEY;
        console.warn('⚠️ Using unencrypted API key - consider encrypting');
      } else {
        this.apiKey = '';
        console.error('❌ Z.AI API key not found - AI features disabled');
      }
    } catch (error) {
      console.error('Failed to initialize API key:', error);
      this.apiKey = '';
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.lastWindowReset > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastWindowReset = now;
    }
    
    return this.requestCount < this.maxRequestsPerWindow;
  }

  private async makeRequest(messages: ZAIMessage[], temperature = 0.7, userId = 'system'): Promise<ZAIResponse> {
    if (!this.apiKey) {
      throw new Error('Z.AI API key not configured');
    }

    // Rate limiting check
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded - please wait before making more requests');
    }

    const startTime = Date.now();
    
    try {
      // Audit log
      const auditLog = createAuditLog('zai_request', userId, {
        endpoint: 'chat/completions',
        message_count: messages.length,
        temperature,
        model: this.model
      });
      
      console.log('🚀 Z.AI Request:', auditLog);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: 2000,
          stream: false
        })
      });

      this.requestCount++;
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Z.AI API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Z.AI API error: ${response.status} ${response.statusText}`);
      }

      const data: ZAIResponse = await response.json();
      
      // Success audit log
      console.log('✅ Z.AI Response received:', {
        response_time: `${responseTime}ms`,
        tokens_used: data.usage?.total_tokens || 0,
        request_id: auditLog.request_id
      });
      
      return data;
    } catch (error) {
      // Error audit log
      console.error('❌ Z.AI Request failed:', createAuditLog('zai_error', userId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        response_time: `${Date.now() - startTime}ms`
      }));
      
      throw error;
    }
  }

  /**
   * Gelişmiş piyasa analizi
   */
  async analyzeMarket(symbol: string, priceData: any, technicalIndicators: any): Promise<MarketAnalysis> {
    const systemPrompt = `Sen profesyonel bir kripto para trading uzmanısın. 
    Teknik analiz, fundamental analiz ve risk yönetimi konularında uzmansın.
    Her analizi detaylı reasoning ile destekle ve risk seviyelerini doğru hesapla.
    JSON formatında yanıt ver.`;

    const userPrompt = `
    ${symbol} için kapsamlı analiz yap:
    
    GÜNCEL VERİLER:
    - Fiyat: ${priceData.price}
    - 24h Değişim: ${priceData.change_24h}%
    - Volume: ${priceData.volume_24h}
    - Market Cap: ${priceData.market_cap}
    
    TEKNİK İNDİKATÖRLER:
    - RSI: ${technicalIndicators.rsi}
    - MACD: ${technicalIndicators.macd}
    - Bollinger Bands: ${JSON.stringify(technicalIndicators.bb)}
    - Moving Averages: ${JSON.stringify(technicalIndicators.ma)}
    
    Analiz sonucunu şu JSON formatında ver:
    {
      "symbol": "${symbol}",
      "action": "BUY|SELL|HOLD|WAIT",
      "confidence": 0-100,
      "reasoning": "detaylı açıklama",
      "entry_price": 123.45,
      "target_price": 150.00,
      "stop_loss": 100.00,
      "risk_level": "LOW|MEDIUM|HIGH",
      "timeframe": "SHORT|MEDIUM|LONG"
    }`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.3);

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Market analysis error:', error);
      return {
        symbol,
        action: 'HOLD',
        confidence: 0,
        reasoning: 'Analiz hatası: ' + (error as Error).message,
        risk_level: 'HIGH',
        timeframe: 'MEDIUM'
      };
    }
  }

  /**
   * Portfolio yönetimi ve risk analizi
   */
  async analyzePortfolio(holdings: any[], marketData: any[]): Promise<PortfolioAnalysis> {
    const systemPrompt = `Sen profesyonel bir portföy yönetici ve risk analisti uzmanısın.
    Diversifikasyon, risk dağılımı ve optimal allokasyon konularında uzmansın.
    JSON formatında yanıt ver.`;

    const userPrompt = `
    PORTFOLIO HOLDİNGS:
    ${JSON.stringify(holdings)}
    
    MARKET DATA:
    ${JSON.stringify(marketData)}
    
    Portfolio analizi yap ve şu JSON formatında yanıt ver:
    {
      "total_value": 12345.67,
      "risk_score": 0-100,
      "diversification": 0-100,
      "recommendations": [
        {
          "action": "REDUCE|INCREASE|HOLD",
          "symbol": "BTC",
          "percentage": 25,
          "reason": "açıklama"
        }
      ]
    }`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.4);

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      return {
        total_value: 0,
        risk_score: 100,
        diversification: 0,
        recommendations: []
      };
    }
  }

  /**
   * Serbest format AI sorguları
   */
  async queryAI(question: string, context?: any): Promise<string> {
    const systemPrompt = `Sen AILYDIAN kripto trading platformunun AI asistanısın.
    Trading, analiz, risk yönetimi ve kripto piyasalar konularında uzmansın.
    Türkçe yanıt ver, pratik ve işlem odaklı tavsiyelerde bulun.`;

    const userPrompt = context 
      ? `${question}\n\nKONTEKST: ${JSON.stringify(context)}`
      : question;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.7);

      return response.choices[0]?.message?.content || 'Yanıt alınamadı.';
    } catch (error) {
      console.error('AI query error:', error);
      return `Üzgünüm, şu anda analiz yapamıyorum: ${(error as Error).message}`;
    }
  }

  /**
   * Otomatik trading senaryoları
   */
  async generateTradingScenario(marketConditions: any, userProfile: any): Promise<any> {
    const systemPrompt = `Sen gelişmiş bir trading algoritması uzmanısın.
    Market koşullarını analiz ederek otomatik trading senaryoları oluşturursun.
    Risk yönetimi, timing ve pozisyon boyutlarını optimize edersin.`;

    const userPrompt = `
    MARKET CONDITIONS:
    ${JSON.stringify(marketConditions)}
    
    USER PROFILE:
    - Risk Tolerance: ${userProfile.risk_tolerance}
    - Capital: ${userProfile.capital}
    - Experience: ${userProfile.experience}
    
    Otomatik trading senaryosu oluştur:
    {
      "scenarios": [
        {
          "name": "Senaryo Adı",
          "conditions": "Hangi koşullarda çalışır",
          "actions": [
            {
              "symbol": "BTC",
              "action": "BUY|SELL",
              "percentage": 25,
              "trigger_price": 45000,
              "stop_loss": 42000,
              "take_profit": 50000
            }
          ],
          "risk_management": "Risk kuralları",
          "expected_return": 15.5,
          "max_drawdown": 8.0
        }
      ]
    }`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.5);

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Trading scenario error:', error);
      return { scenarios: [] };
    }
  }

  /**
   * Real-time piyasa yorumu
   */
  async interpretMarketMovement(priceMovements: any[], newsData: any[]): Promise<string> {
    const systemPrompt = `Sen kripto piyasalarında uzman bir analistin.
    Fiyat hareketlerini ve haberleri analiz ederek piyasa yorumu yaparsın.
    Türkçe, anlaşılır ve işlem odaklı yorumlar yaparsın.`;

    const userPrompt = `
    FİYAT HAREKETLERİ:
    ${JSON.stringify(priceMovements)}
    
    GÜNCEL HABERLER:
    ${JSON.stringify(newsData)}
    
    Bu verilere dayanarak piyasa yorumu yap ve trading önerileri ver.`;

    try {
      const response = await this.makeRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 0.6);

      return response.choices[0]?.message?.content || 'Piyasa yorumu yapılamadı.';
    } catch (error) {
      console.error('Market interpretation error:', error);
      return `Piyasa analizi şu anda mevcut değil: ${(error as Error).message}`;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await this.makeRequest([
        { role: 'user', content: 'Test mesajı - sadece OK yanıtla' }
      ], 0.1);
      
      return response.choices?.length > 0;
    } catch {
      return false;
    }
  }
}

export default ZAIService;
export type { MarketAnalysis, PortfolioAnalysis };
