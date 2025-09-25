import { EventEmitter } from 'events';

export interface SentimentData {
  symbol: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // -1 to 1
  confidence: number;
  sources: {
    twitter: number;
    reddit: number;
    news: number;
    telegram: number;
  };
  keywords: string[];
  timestamp: number;
  volume: number; // Mention count
}

export interface NewsItem {
  title: string;
  content: string;
  source: string;
  sentiment: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  symbols: string[];
}

export class SentimentAnalysisEngine extends EventEmitter {
  private sentimentData = new Map<string, SentimentData>();
  private keywords = new Map<string, string[]>();
  private isActive = false;
  private updateInterval?: NodeJS.Timeout;

  // Sentiment keywords
  private bullishKeywords = [
    'moon', 'pump', 'bull', 'buy', 'hodl', 'rocket', 'diamond hands',
    'breakout', 'surge', 'rally', 'bullish', 'up', 'rise', 'gain',
    'positive', 'strong', 'support', 'breakthrough', 'momentum'
  ];

  private bearishKeywords = [
    'crash', 'dump', 'bear', 'sell', 'drop', 'fall', 'decline',
    'bearish', 'down', 'loss', 'negative', 'weak', 'resistance',
    'correction', 'panic', 'fear', 'liquidation', 'selloff'
  ];

  private neutralKeywords = [
    'hold', 'wait', 'watch', 'consolidation', 'sideways', 'flat',
    'uncertain', 'mixed', 'analysis', 'technical', 'fundamental'
  ];

  constructor() {
    super();
    this.initializeKeywords();
    console.log('📊 Sentiment Analysis Engine başlatıldı');
  }

  private initializeKeywords() {
    // Crypto symbols
    this.keywords.set('BTC', ['bitcoin', 'btc', '#bitcoin', '$btc']);
    this.keywords.set('ETH', ['ethereum', 'eth', '#ethereum', '$eth']);
    this.keywords.set('ADA', ['cardano', 'ada', '#cardano', '$ada']);
    this.keywords.set('SOL', ['solana', 'sol', '#solana', '$sol']);
    this.keywords.set('MATIC', ['polygon', 'matic', '#polygon', '$matic']);

    // Stock symbols  
    this.keywords.set('AAPL', ['apple', 'aapl', '#apple', '$aapl', 'iphone']);
    this.keywords.set('TSLA', ['tesla', 'tsla', '#tesla', '$tsla', 'elon']);
    this.keywords.set('MSFT', ['microsoft', 'msft', '#microsoft', '$msft']);
    this.keywords.set('GOOGL', ['google', 'googl', '#google', '$googl', 'alphabet']);
    this.keywords.set('AMZN', ['amazon', 'amzn', '#amazon', '$amzn']);

    // Turkish stocks
    this.keywords.set('THYAO', ['thyao', 'türk hava yolları', 'turkish airlines']);
    this.keywords.set('AKBNK', ['akbank', 'akbnk', '#akbank']);
    this.keywords.set('GARAN', ['garanti', 'garan', '#garanti']);
  }

  public async startMonitoring(): Promise<void> {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🔍 Sentiment monitoring başlatıldı');

    // Simulated real-time updates
    this.updateInterval = setInterval(() => {
      this.updateSentimentData();
    }, 30000); // Her 30 saniyede güncelle

    this.emit('monitoringStarted');
  }

  public stopMonitoring(): void {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    console.log('⏹️ Sentiment monitoring durduruldu');
    this.emit('monitoringStopped');
  }

  private async updateSentimentData(): Promise<void> {
    try {
      for (const [symbol] of this.keywords.entries()) {
        const sentiment = await this.analyzeSentiment(symbol);
        this.sentimentData.set(symbol, sentiment);
        this.emit('sentimentUpdate', sentiment);
      }
    } catch (error) {
      console.error('❌ Sentiment update hatası:', error);
    }
  }

  private async analyzeSentiment(symbol: string): Promise<SentimentData> {
    // Simulated sentiment analysis
    const symbolKeywords = this.keywords.get(symbol) || [];
    
    // Generate realistic sentiment data
    const baseScore = (Math.random() - 0.5) * 2; // -1 to 1
    const confidence = 0.6 + Math.random() * 0.3; // 0.6 to 0.9
    const volume = Math.floor(100 + Math.random() * 1000);

    // Determine sentiment
    let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (baseScore > 0.2) sentiment = 'BULLISH';
    else if (baseScore < -0.2) sentiment = 'BEARISH';
    else sentiment = 'NEUTRAL';

    // Generate source scores
    const sources = {
      twitter: Math.random(),
      reddit: Math.random(),
      news: Math.random(),
      telegram: Math.random()
    };

    // Generate relevant keywords based on sentiment
    const keywords = this.generateRelevantKeywords(sentiment);

    return {
      symbol,
      sentiment,
      score: baseScore,
      confidence,
      sources,
      keywords: [...symbolKeywords, ...keywords],
      timestamp: Date.now(),
      volume
    };
  }

  private generateRelevantKeywords(sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): string[] {
    const keywords: string[] = [];
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 keywords

    let sourceKeywords: string[];
    switch (sentiment) {
      case 'BULLISH':
        sourceKeywords = this.bullishKeywords;
        break;
      case 'BEARISH':
        sourceKeywords = this.bearishKeywords;
        break;
      default:
        sourceKeywords = this.neutralKeywords;
    }

    // Random selection
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * sourceKeywords.length);
      const keyword = sourceKeywords[randomIndex];
      if (!keywords.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }

  public async analyzeNews(newsItems: NewsItem[]): Promise<Map<string, SentimentData>> {
    const results = new Map<string, SentimentData>();

    for (const news of newsItems) {
      for (const symbol of news.symbols) {
        const existingSentiment = results.get(symbol) || {
          symbol,
          sentiment: 'NEUTRAL' as const,
          score: 0,
          confidence: 0,
          sources: { twitter: 0, reddit: 0, news: 0, telegram: 0 },
          keywords: [],
          timestamp: Date.now(),
          volume: 0
        };

        // Update with news sentiment
        existingSentiment.sources.news += news.sentiment;
        existingSentiment.volume += 1;
        existingSentiment.score = (existingSentiment.score + news.sentiment) / 2;
        
        // Update sentiment classification
        if (existingSentiment.score > 0.2) existingSentiment.sentiment = 'BULLISH';
        else if (existingSentiment.score < -0.2) existingSentiment.sentiment = 'BEARISH';
        else existingSentiment.sentiment = 'NEUTRAL';

        // Extract keywords from news
        const extractedKeywords = this.extractKeywordsFromText(news.title + ' ' + news.content);
        existingSentiment.keywords = [...new Set([...existingSentiment.keywords, ...extractedKeywords])];

        results.set(symbol, existingSentiment);
      }
    }

    return results;
  }

  private extractKeywordsFromText(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const keywords: string[] = [];

    // Check for bullish keywords
    for (const word of words) {
      if (this.bullishKeywords.includes(word) || 
          this.bearishKeywords.includes(word) || 
          this.neutralKeywords.includes(word)) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  public getSentiment(symbol: string): SentimentData | null {
    return this.sentimentData.get(symbol) || null;
  }

  public getAllSentiments(): Map<string, SentimentData> {
    return new Map(this.sentimentData);
  }

  public getTopMentioned(limit: number = 10): SentimentData[] {
    return Array.from(this.sentimentData.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  public getBullishSignals(minConfidence: number = 0.7): SentimentData[] {
    return Array.from(this.sentimentData.values())
      .filter(data => 
        data.sentiment === 'BULLISH' && 
        data.confidence >= minConfidence &&
        data.score > 0.3
      )
      .sort((a, b) => b.score - a.score);
  }

  public getBearishSignals(minConfidence: number = 0.7): SentimentData[] {
    return Array.from(this.sentimentData.values())
      .filter(data => 
        data.sentiment === 'BEARISH' && 
        data.confidence >= minConfidence &&
        data.score < -0.3
      )
      .sort((a, b) => a.score - b.score);
  }

  public getSentimentTrend(symbol: string, hours: number = 24): {
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    change: number;
  } {
    // Simulated trend analysis
    const change = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2 change
    
    let trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    if (change > 0.05) trend = 'IMPROVING';
    else if (change < -0.05) trend = 'DECLINING';
    else trend = 'STABLE';

    return { trend, change };
  }

  public generateSentimentReport(symbol: string): {
    summary: string;
    signals: string[];
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: 'BUY' | 'SELL' | 'HOLD';
  } {
    const sentiment = this.getSentiment(symbol);
    
    if (!sentiment) {
      return {
        summary: `${symbol} için sentiment verisi bulunamadı`,
        signals: [],
        risk: 'MEDIUM',
        recommendation: 'HOLD'
      };
    }

    const trend = this.getSentimentTrend(symbol);
    
    // Generate summary
    let summary = `${symbol} için sentiment: ${sentiment.sentiment} (${(sentiment.score * 100).toFixed(1)}% score)`;
    summary += ` - Trend: ${trend.trend} (${(trend.change * 100).toFixed(1)}% değişim)`;
    summary += ` - Güven: ${(sentiment.confidence * 100).toFixed(1)}%`;

    // Generate signals
    const signals: string[] = [];
    
    if (sentiment.sentiment === 'BULLISH' && sentiment.confidence > 0.8) {
      signals.push('🚀 Güçlü yükseliş sinyali tespit edildi');
    }
    
    if (sentiment.sentiment === 'BEARISH' && sentiment.confidence > 0.8) {
      signals.push('⚠️ Güçlü düşüş sinyali tespit edildi');
    }
    
    if (sentiment.volume > 500) {
      signals.push('📢 Yüksek mention hacmi - artan ilgi');
    }
    
    if (trend.trend === 'IMPROVING') {
      signals.push('📈 Sentiment trend iyileşiyor');
    } else if (trend.trend === 'DECLINING') {
      signals.push('📉 Sentiment trend kötüleşiyor');
    }

    // Assess risk
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (sentiment.confidence > 0.8 && Math.abs(sentiment.score) > 0.5) {
      risk = sentiment.sentiment === 'BEARISH' ? 'HIGH' : 'LOW';
    }

    // Generate recommendation
    let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (sentiment.sentiment === 'BULLISH' && sentiment.confidence > 0.75 && trend.trend === 'IMPROVING') {
      recommendation = 'BUY';
    } else if (sentiment.sentiment === 'BEARISH' && sentiment.confidence > 0.75 && trend.trend === 'DECLINING') {
      recommendation = 'SELL';
    }

    return { summary, signals, risk, recommendation };
  }

  public addCustomKeywords(symbol: string, keywords: string[]): void {
    const existing = this.keywords.get(symbol) || [];
    this.keywords.set(symbol, [...existing, ...keywords]);
    console.log(`➕ ${symbol} için ${keywords.length} adet keyword eklendi`);
  }

  public isActive(): boolean {
    return this.isActive;
  }

  public getStats(): {
    totalSymbols: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    avgConfidence: number;
    totalVolume: number;
  } {
    const sentiments = Array.from(this.sentimentData.values());
    
    return {
      totalSymbols: sentiments.length,
      bullishCount: sentiments.filter(s => s.sentiment === 'BULLISH').length,
      bearishCount: sentiments.filter(s => s.sentiment === 'BEARISH').length,
      neutralCount: sentiments.filter(s => s.sentiment === 'NEUTRAL').length,
      avgConfidence: sentiments.reduce((acc, s) => acc + s.confidence, 0) / sentiments.length || 0,
      totalVolume: sentiments.reduce((acc, s) => acc + s.volume, 0)
    };
  }

  public dispose(): void {
    this.stopMonitoring();
    this.sentimentData.clear();
    this.keywords.clear();
    console.log('🗑️ Sentiment Analysis Engine temizlendi');
  }
}

export default SentimentAnalysisEngine;