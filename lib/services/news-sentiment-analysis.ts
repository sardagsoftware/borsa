// Advanced News Sentiment Analysis with Real-time Processing
import { EventEmitter } from 'events';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  weight: number; // Credibility weight 0-1
  type: 'financial' | 'crypto' | 'general' | 'social' | 'regulatory';
  language: string;
  updateFrequency: number; // minutes
  isActive: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: NewsSource;
  url: string;
  publishedAt: number;
  symbols: string[]; // Mentioned crypto symbols
  
  sentiment: {
    overall: number; // -1 to 1
    confidence: number; // 0 to 1
    breakdown: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  
  classification: {
    category: 'price_movement' | 'regulation' | 'adoption' | 'technology' | 'partnership' | 'market_analysis' | 'other';
    importance: 'low' | 'medium' | 'high' | 'critical';
    impact: {
      shortTerm: number; // Expected impact 1-24 hours (-1 to 1)
      mediumTerm: number; // Expected impact 1-7 days (-1 to 1)
      longTerm: number; // Expected impact 1+ weeks (-1 to 1)
    };
  };
  
  keywords: string[];
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    cryptocurrencies: string[];
  };
  
  marketRelevance: number; // 0 to 1
  credibilityScore: number; // 0 to 1
}

export interface SocialMediaPost {
  id: string;
  platform: 'twitter' | 'reddit' | 'telegram' | 'discord' | 'youtube';
  author: {
    username: string;
    followers: number;
    verified: boolean;
    credibilityScore: number;
  };
  content: string;
  timestamp: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  sentiment: {
    score: number; // -1 to 1
    confidence: number;
  };
  mentions: string[]; // Mentioned symbols
  influence: number; // Calculated influence score
}

export interface SentimentSignal {
  symbol: string;
  timestamp: number;
  
  aggregatedSentiment: {
    news: number; // -1 to 1
    social: number; // -1 to 1
    overall: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  
  momentum: {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0 to 1
    acceleration: number; // Change in sentiment
  };
  
  sources: {
    newsCount: number;
    socialCount: number;
    highCredibilityCount: number;
    lowCredibilityCount: number;
  };
  
  marketImpact: {
    expected: number; // -1 to 1
    timeframe: '1h' | '4h' | '1d' | '1w';
    confidence: number;
  };
  
  alerts: {
    type: 'sentiment_spike' | 'volume_surge' | 'credible_source' | 'regulatory' | 'whale_activity';
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }[];
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: number;
  velocity: number; // Rate of growth
  symbols: string[];
  timeframe: number; // minutes
  sources: string[];
}

export class NewsSentimentAnalyzer extends EventEmitter {
  private newsSources: Map<string, NewsSource> = new Map();
  private articles: Map<string, NewsArticle> = new Map();
  private socialPosts: Map<string, SocialMediaPost> = new Map();
  private sentimentHistory: Map<string, SentimentSignal[]> = new Map();
  private trendingTopics: TrendingTopic[] = [];
  
  // Sentiment analysis models
  private sentimentModel: any; // Would be actual ML model
  private namedEntityRecognition: any;
  private keywordExtractor: any;
  
  // Market-specific dictionaries
  private cryptoTerms: Map<string, number> = new Map(); // term -> sentiment weight
  private financialTerms: Map<string, number> = new Map();
  private regulatoryTerms: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeSentimentAnalysis();
  }

  private initializeSentimentAnalysis() {
    // Initialize news sources
    this.setupNewsSources();
    
    // Initialize sentiment dictionaries
    this.initializeSentimentDictionaries();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  private setupNewsSources() {
    // Financial News Sources
    this.newsSources.set('coindesk', {
      id: 'coindesk',
      name: 'CoinDesk',
      url: 'https://api.coindesk.com',
      weight: 0.9,
      type: 'crypto',
      language: 'en',
      updateFrequency: 15,
      isActive: true,
    });

    this.newsSources.set('cointelegraph', {
      id: 'cointelegraph',
      name: 'Cointelegraph',
      url: 'https://api.cointelegraph.com',
      weight: 0.85,
      type: 'crypto',
      language: 'en',
      updateFrequency: 20,
      isActive: true,
    });

    this.newsSources.set('bloomberg', {
      id: 'bloomberg',
      name: 'Bloomberg',
      url: 'https://api.bloomberg.com',
      weight: 0.95,
      type: 'financial',
      language: 'en',
      updateFrequency: 30,
      isActive: true,
    });

    this.newsSources.set('reuters', {
      id: 'reuters',
      name: 'Reuters',
      url: 'https://api.reuters.com',
      weight: 0.9,
      type: 'financial',
      language: 'en',
      updateFrequency: 30,
      isActive: true,
    });

    // Social Media Sources
    this.newsSources.set('crypto_twitter', {
      id: 'crypto_twitter',
      name: 'Crypto Twitter',
      url: 'https://api.twitter.com',
      weight: 0.6,
      type: 'social',
      language: 'en',
      updateFrequency: 5,
      isActive: true,
    });

    this.newsSources.set('reddit_crypto', {
      id: 'reddit_crypto',
      name: 'Reddit Cryptocurrency',
      url: 'https://api.reddit.com',
      weight: 0.5,
      type: 'social',
      language: 'en',
      updateFrequency: 10,
      isActive: true,
    });
  }

  private initializeSentimentDictionaries() {
    // Crypto-specific terms with sentiment weights
    this.cryptoTerms.set('bullish', 0.8);
    this.cryptoTerms.set('bearish', -0.8);
    this.cryptoTerms.set('moon', 0.7);
    this.cryptoTerms.set('dump', -0.9);
    this.cryptoTerms.set('pump', 0.6);
    this.cryptoTerms.set('hodl', 0.4);
    this.cryptoTerms.set('rekt', -0.8);
    this.cryptoTerms.set('fud', -0.7);
    this.cryptoTerms.set('fomo', 0.3);
    this.cryptoTerms.set('diamond hands', 0.6);
    this.cryptoTerms.set('paper hands', -0.4);
    this.cryptoTerms.set('to the moon', 0.8);
    this.cryptoTerms.set('crashed', -0.9);
    this.cryptoTerms.set('mooning', 0.8);
    this.cryptoTerms.set('lambo', 0.7);
    this.cryptoTerms.set('whale', 0.2);
    this.cryptoTerms.set('rug pull', -0.9);
    this.cryptoTerms.set('gem', 0.7);

    // Financial terms
    this.financialTerms.set('bullmarket', 0.8);
    this.financialTerms.set('bearmarket', -0.8);
    this.financialTerms.set('rally', 0.7);
    this.financialTerms.set('correction', -0.6);
    this.financialTerms.set('breakout', 0.6);
    this.financialTerms.set('breakdown', -0.6);
    this.financialTerms.set('support', 0.3);
    this.financialTerms.set('resistance', -0.2);
    this.financialTerms.set('all-time high', 0.8);
    this.financialTerms.set('crash', -0.9);
    this.financialTerms.set('bubble', -0.7);
    this.financialTerms.set('institutional adoption', 0.8);
    this.financialTerms.set('mass adoption', 0.9);

    // Regulatory terms
    this.regulatoryTerms.set('banned', -0.9);
    this.regulatoryTerms.set('regulated', -0.3);
    this.regulatoryTerms.set('approved', 0.8);
    this.regulatoryTerms.set('investigation', -0.6);
    this.regulatoryTerms.set('lawsuit', -0.8);
    this.regulatoryTerms.set('compliance', 0.4);
    this.regulatoryTerms.set('license', 0.6);
    this.regulatoryTerms.set('illegal', -0.9);
    this.regulatoryTerms.set('crackdown', -0.8);
    this.regulatoryTerms.set('partnership', 0.7);
  }

  // Main sentiment analysis function
  public async analyzeSentiment(symbol: string): Promise<SentimentSignal> {
    const newsArticles = this.getRecentArticles(symbol, 24); // Last 24 hours
    const socialPosts = this.getRecentSocialPosts(symbol, 24);

    // Analyze news sentiment
    const newsSentiment = this.analyzeNewsSentiment(newsArticles);
    
    // Analyze social media sentiment
    const socialSentiment = this.analyzeSocialSentiment(socialPosts);
    
    // Calculate overall sentiment
    const overall = this.combinesentiment(newsSentiment, socialSentiment, newsArticles, socialPosts);
    
    // Calculate momentum and trends
    const momentum = this.calculateSentimentMomentum(symbol);
    
    // Assess market impact
    const marketImpact = this.assessMarketImpact(overall, newsArticles, socialPosts);
    
    // Generate alerts
    const alerts = this.generateSentimentAlerts(symbol, overall, momentum, newsArticles, socialPosts);

    const signal: SentimentSignal = {
      symbol,
      timestamp: Date.now(),
      aggregatedSentiment: {
        news: newsSentiment.score,
        social: socialSentiment.score,
        overall: overall.score,
        confidence: overall.confidence,
      },
      momentum,
      sources: {
        newsCount: newsArticles.length,
        socialCount: socialPosts.length,
        highCredibilityCount: newsArticles.filter(a => a.credibilityScore > 0.7).length +
                             socialPosts.filter(p => p.author.credibilityScore > 0.7).length,
        lowCredibilityCount: newsArticles.filter(a => a.credibilityScore < 0.3).length +
                            socialPosts.filter(p => p.author.credibilityScore < 0.3).length,
      },
      marketImpact,
      alerts,
    };

    // Store in history
    if (!this.sentimentHistory.has(symbol)) {
      this.sentimentHistory.set(symbol, []);
    }
    const history = this.sentimentHistory.get(symbol)!;
    history.push(signal);
    if (history.length > 1440) history.shift(); // Keep 24 hours of minute data

    // Emit signal
    this.emit('sentimentSignal', signal);

    return signal;
  }

  // Process individual news article
  public async processNewsArticle(rawArticle: any, source: NewsSource): Promise<NewsArticle> {
    const article: NewsArticle = {
      id: this.generateId(),
      title: rawArticle.title,
      content: rawArticle.content || rawArticle.description,
      summary: await this.generateSummary(rawArticle.content),
      source,
      url: rawArticle.url,
      publishedAt: new Date(rawArticle.publishedAt).getTime(),
      symbols: this.extractCryptoSymbols(rawArticle.title + ' ' + rawArticle.content),
      
      sentiment: await this.analyzeSingleArticleSentiment(rawArticle),
      classification: await this.classifyArticle(rawArticle),
      keywords: this.extractKeywords(rawArticle.title + ' ' + rawArticle.content),
      entities: this.extractEntities(rawArticle.title + ' ' + rawArticle.content),
      marketRelevance: this.calculateMarketRelevance(rawArticle, source),
      credibilityScore: this.calculateCredibilityScore(rawArticle, source),
    };

    this.articles.set(article.id, article);
    
    // Keep only recent articles (last 7 days)
    this.cleanOldArticles();

    return article;
  }

  // Process social media post
  public async processSocialPost(rawPost: any, platform: string): Promise<SocialMediaPost> {
    const post: SocialMediaPost = {
      id: this.generateId(),
      platform: platform as any,
      author: {
        username: rawPost.author.username,
        followers: rawPost.author.followers || 0,
        verified: rawPost.author.verified || false,
        credibilityScore: this.calculateUserCredibility(rawPost.author),
      },
      content: rawPost.content,
      timestamp: new Date(rawPost.timestamp).getTime(),
      engagement: {
        likes: rawPost.likes || 0,
        shares: rawPost.shares || rawPost.retweets || 0,
        comments: rawPost.comments || rawPost.replies || 0,
        views: rawPost.views || 0,
      },
      sentiment: await this.analyzeSocialPostSentiment(rawPost.content),
      mentions: this.extractCryptoSymbols(rawPost.content),
      influence: this.calculatePostInfluence(rawPost),
    };

    this.socialPosts.set(post.id, post);
    
    // Keep only recent posts (last 3 days)
    this.cleanOldSocialPosts();

    return post;
  }

  // Advanced sentiment analysis for articles
  private async analyzeSingleArticleSentiment(article: any): Promise<NewsArticle['sentiment']> {
    const text = article.title + ' ' + (article.content || article.description);
    
    // Rule-based sentiment analysis
    const ruleBasedSentiment = this.calculateRuleBasedSentiment(text);
    
    // ML-based sentiment (mock implementation)
    const mlSentiment = await this.calculateMLSentiment(text);
    
    // Combine sentiments
    const overall = (ruleBasedSentiment.score * 0.4) + (mlSentiment.score * 0.6);
    const confidence = Math.min(ruleBasedSentiment.confidence, mlSentiment.confidence);
    
    // Calculate breakdown
    const positive = Math.max(0, overall);
    const negative = Math.max(0, -overall);
    const neutral = 1 - Math.abs(overall);

    return {
      overall,
      confidence,
      breakdown: {
        positive,
        negative,
        neutral,
      },
    };
  }

  private calculateRuleBasedSentiment(text: string): { score: number; confidence: number } {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let matches = 0;

    // Check crypto terms
    this.cryptoTerms.forEach((weight, term) => {
      if (text.toLowerCase().includes(term)) {
        score += weight;
        matches++;
      }
    });

    // Check financial terms
    this.financialTerms.forEach((weight, term) => {
      if (text.toLowerCase().includes(term)) {
        score += weight;
        matches++;
      }
    });

    // Check regulatory terms
    this.regulatoryTerms.forEach((weight, term) => {
      if (text.toLowerCase().includes(term)) {
        score += weight * 1.2; // Regulatory news has higher impact
        matches++;
      }
    });

    // Normalize score
    const normalizedScore = matches > 0 ? Math.tanh(score / Math.sqrt(matches)) : 0;
    const confidence = Math.min(1, matches / 5); // Higher confidence with more matches

    return { score: normalizedScore, confidence };
  }

  private async calculateMLSentiment(text: string): Promise<{ score: number; confidence: number }> {
    // Mock ML sentiment analysis - in production, use actual models like BERT, RoBERTa
    // This would call a sentiment analysis API or local model
    
    // Simulate sentiment analysis
    const words = text.toLowerCase().split(/\s+/);
    const positiveWords = words.filter(word => 
      ['good', 'great', 'excellent', 'positive', 'bullish', 'up', 'rise', 'gain'].includes(word)
    ).length;
    
    const negativeWords = words.filter(word => 
      ['bad', 'terrible', 'negative', 'bearish', 'down', 'fall', 'loss', 'crash'].includes(word)
    ).length;
    
    const totalSentimentWords = positiveWords + negativeWords;
    const score = totalSentimentWords > 0 ? 
      (positiveWords - negativeWords) / totalSentimentWords : 0;
    
    const confidence = Math.min(1, totalSentimentWords / words.length * 10);
    
    return { score: Math.tanh(score), confidence };
  }

  // Classify article importance and category
  private async classifyArticle(article: any): Promise<NewsArticle['classification']> {
    const text = (article.title + ' ' + (article.content || article.description)).toLowerCase();
    
    // Determine category
    let category: NewsArticle['classification']['category'] = 'other';
    
    if (text.includes('price') || text.includes('trading') || text.includes('market')) {
      category = 'price_movement';
    } else if (text.includes('regulation') || text.includes('sec') || text.includes('government')) {
      category = 'regulation';
    } else if (text.includes('adoption') || text.includes('partnership') || text.includes('integration')) {
      category = 'adoption';
    } else if (text.includes('blockchain') || text.includes('protocol') || text.includes('upgrade')) {
      category = 'technology';
    } else if (text.includes('partner') || text.includes('collaboration') || text.includes('deal')) {
      category = 'partnership';
    } else if (text.includes('analysis') || text.includes('prediction') || text.includes('forecast')) {
      category = 'market_analysis';
    }

    // Determine importance
    let importance: NewsArticle['classification']['importance'] = 'low';
    
    // High importance keywords
    const highImportanceTerms = ['sec', 'federal reserve', 'etf', 'regulation', 'ban', 'legal'];
    const mediumImportanceTerms = ['partnership', 'adoption', 'institutional', 'whale'];
    
    if (highImportanceTerms.some(term => text.includes(term))) {
      importance = 'critical';
    } else if (mediumImportanceTerms.some(term => text.includes(term))) {
      importance = 'high';
    } else if (category !== 'other') {
      importance = 'medium';
    }

    // Calculate impact based on sentiment and importance
    const sentiment = await this.analyzeSingleArticleSentiment(article);
    const impactMultiplier = importance === 'critical' ? 1.0 : 
                           importance === 'high' ? 0.7 : 
                           importance === 'medium' ? 0.4 : 0.2;
    
    return {
      category,
      importance,
      impact: {
        shortTerm: sentiment.overall * impactMultiplier,
        mediumTerm: sentiment.overall * impactMultiplier * 0.7,
        longTerm: sentiment.overall * impactMultiplier * 0.4,
      },
    };
  }

  // Extract cryptocurrency symbols from text
  private extractCryptoSymbols(text: string): string[] {
    const symbols = new Set<string>();
    const upperText = text.toUpperCase();
    
    // Common crypto symbols
    const commonSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI'];
    
    commonSymbols.forEach(symbol => {
      if (upperText.includes(symbol) || upperText.includes('$' + symbol)) {
        symbols.add(symbol);
      }
    });
    
    // Look for $ symbols
    const dollarMatches = text.match(/\$[A-Z]{2,6}/g);
    if (dollarMatches) {
      dollarMatches.forEach(match => {
        symbols.add(match.substring(1));
      });
    }
    
    // Look for full names
    const cryptoNames: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binance coin': 'BNB',
      'cardano': 'ADA',
      'polkadot': 'DOT',
      'solana': 'SOL',
      'polygon': 'MATIC',
      'avalanche': 'AVAX',
      'chainlink': 'LINK',
      'uniswap': 'UNI',
    };
    
    Object.entries(cryptoNames).forEach(([name, symbol]) => {
      if (text.toLowerCase().includes(name)) {
        symbols.add(symbol);
      }
    });
    
    return Array.from(symbols);
  }

  // Extract keywords using TF-IDF-like approach
  private extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Calculate word frequency
    const wordFreq: { [word: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Extract named entities (simplified)
  private extractEntities(text: string): NewsArticle['entities'] {
    // Mock implementation - in production, use proper NER models
    return {
      people: this.extractPeople(text),
      organizations: this.extractOrganizations(text),
      locations: this.extractLocations(text),
      cryptocurrencies: this.extractCryptoSymbols(text),
    };
  }

  private extractPeople(text: string): string[] {
    // Mock people extraction
    const knownPeople = ['Elon Musk', 'Vitalik Buterin', 'Michael Saylor', 'Cathie Wood'];
    return knownPeople.filter(person => text.includes(person));
  }

  private extractOrganizations(text: string): string[] {
    const knownOrgs = ['Tesla', 'MicroStrategy', 'Goldman Sachs', 'JPMorgan', 'Coinbase', 'Binance'];
    return knownOrgs.filter(org => text.includes(org));
  }

  private extractLocations(text: string): string[] {
    const knownLocations = ['United States', 'China', 'Europe', 'Japan', 'South Korea'];
    return knownLocations.filter(location => text.includes(location));
  }

  // Calculate various scores
  private calculateMarketRelevance(article: any, source: NewsSource): number {
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    
    let relevance = 0.3; // Base relevance
    
    // Boost for crypto-specific sources
    if (source.type === 'crypto') relevance += 0.3;
    
    // Boost for market-related keywords
    const marketTerms = ['price', 'trading', 'market', 'investment', 'portfolio'];
    marketTerms.forEach(term => {
      if (text.includes(term)) relevance += 0.1;
    });
    
    // Boost for specific crypto mentions
    if (this.extractCryptoSymbols(text).length > 0) relevance += 0.2;
    
    return Math.min(1, relevance);
  }

  private calculateCredibilityScore(article: any, source: NewsSource): number {
    let score = source.weight; // Base credibility from source
    
    // Adjust based on article characteristics
    const hasAuthor = article.author && article.author.length > 0;
    if (hasAuthor) score += 0.1;
    
    const hasDate = article.publishedAt && new Date(article.publishedAt).getTime() > 0;
    if (hasDate) score += 0.1;
    
    const hasContent = article.content && article.content.length > 100;
    if (hasContent) score += 0.1;
    
    return Math.min(1, score);
  }

  private calculateUserCredibility(user: any): number {
    let score = 0.3; // Base score
    
    if (user.verified) score += 0.3;
    if (user.followers > 10000) score += 0.2;
    if (user.followers > 100000) score += 0.2;
    
    return Math.min(1, score);
  }

  private calculatePostInfluence(post: any): number {
    const engagement = (post.likes || 0) + (post.shares || 0) * 2 + (post.comments || 0);
    const followerBoost = Math.log10((post.author?.followers || 0) + 1) / 7; // Normalize to 0-1
    
    return Math.min(1, (engagement / 1000) + followerBoost);
  }

  // Aggregate sentiment analysis
  private analyzeNewsSentiment(articles: NewsArticle[]): { score: number; confidence: number } {
    if (articles.length === 0) return { score: 0, confidence: 0 };
    
    let weightedScore = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    
    articles.forEach(article => {
      const weight = article.credibilityScore * article.marketRelevance;
      weightedScore += article.sentiment.overall * weight;
      totalWeight += weight;
      confidenceSum += article.sentiment.confidence;
    });
    
    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const confidence = articles.length > 0 ? confidenceSum / articles.length : 0;
    
    return { score, confidence };
  }

  private analyzeSocialSentiment(posts: SocialMediaPost[]): { score: number; confidence: number } {
    if (posts.length === 0) return { score: 0, confidence: 0 };
    
    let weightedScore = 0;
    let totalWeight = 0;
    let confidenceSum = 0;
    
    posts.forEach(post => {
      const weight = post.author.credibilityScore * post.influence;
      weightedScore += post.sentiment.score * weight;
      totalWeight += weight;
      confidenceSum += post.sentiment.confidence;
    });
    
    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const confidence = posts.length > 0 ? confidenceSum / posts.length : 0;
    
    return { score, confidence };
  }

  private combinesentiment(
    news: { score: number; confidence: number },
    social: { score: number; confidence: number },
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): { score: number; confidence: number } {
    
    // Weight news higher than social media
    const newsWeight = 0.7;
    const socialWeight = 0.3;
    
    // Adjust weights based on volume and recency
    let adjustedNewsWeight = newsWeight;
    let adjustedSocialWeight = socialWeight;
    
    if (articles.length === 0) {
      adjustedNewsWeight = 0;
      adjustedSocialWeight = 1;
    } else if (posts.length === 0) {
      adjustedNewsWeight = 1;
      adjustedSocialWeight = 0;
    }
    
    const combinedScore = (news.score * adjustedNewsWeight) + (social.score * adjustedSocialWeight);
    const combinedConfidence = (news.confidence * adjustedNewsWeight) + (social.confidence * adjustedSocialWeight);
    
    return {
      score: combinedScore,
      confidence: combinedConfidence,
    };
  }

  // Sentiment momentum calculation
  private calculateSentimentMomentum(symbol: string): SentimentSignal['momentum'] {
    const history = this.sentimentHistory.get(symbol) || [];
    
    if (history.length < 2) {
      return { direction: 'neutral', strength: 0, acceleration: 0 };
    }
    
    const recent = history.slice(-10); // Last 10 data points
    const current = recent[recent.length - 1];
    const previous = recent[recent.length - 2];
    
    const change = current.aggregatedSentiment.overall - previous.aggregatedSentiment.overall;
    const acceleration = recent.length > 2 ? 
      change - (previous.aggregatedSentiment.overall - recent[recent.length - 3].aggregatedSentiment.overall) : 0;
    
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (change > 0.1) direction = 'bullish';
    else if (change < -0.1) direction = 'bearish';
    
    const strength = Math.min(1, Math.abs(change) * 5);
    
    return { direction, strength, acceleration };
  }

  private assessMarketImpact(
    sentiment: { score: number; confidence: number },
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): SentimentSignal['marketImpact'] {
    
    // Base impact from sentiment strength
    let expectedImpact = sentiment.score * sentiment.confidence;
    
    // Adjust based on news importance
    const criticalNews = articles.filter(a => a.classification.importance === 'critical');
    const highImportanceNews = articles.filter(a => a.classification.importance === 'high');
    
    if (criticalNews.length > 0) {
      expectedImpact *= 1.5;
    } else if (highImportanceNews.length > 0) {
      expectedImpact *= 1.2;
    }
    
    // Adjust based on volume
    const volumeBoost = Math.min(0.3, (articles.length + posts.length) / 100);
    expectedImpact += volumeBoost * Math.sign(expectedImpact);
    
    // Determine timeframe based on news type
    let timeframe: '1h' | '4h' | '1d' | '1w' = '1d';
    
    if (criticalNews.length > 0) timeframe = '1h';
    else if (posts.length > articles.length * 5) timeframe = '4h'; // Social media dominated
    else if (articles.some(a => a.classification.category === 'regulation')) timeframe = '1w';
    
    const confidence = sentiment.confidence * Math.min(1, (articles.length + posts.length) / 10);
    
    return {
      expected: Math.max(-1, Math.min(1, expectedImpact)),
      timeframe,
      confidence,
    };
  }

  private generateSentimentAlerts(
    symbol: string,
    sentiment: { score: number; confidence: number },
    momentum: SentimentSignal['momentum'],
    articles: NewsArticle[],
    posts: SocialMediaPost[]
  ): SentimentSignal['alerts'] {
    
    const alerts: SentimentSignal['alerts'] = [];
    
    // Sentiment spike alerts
    if (Math.abs(sentiment.score) > 0.7 && sentiment.confidence > 0.6) {
      alerts.push({
        type: 'sentiment_spike',
        severity: 'warning',
        message: `Strong ${sentiment.score > 0 ? 'positive' : 'negative'} sentiment detected for ${symbol}`,
      });
    }
    
    // Volume surge alerts
    const totalMentions = articles.length + posts.length;
    if (totalMentions > 50) {
      alerts.push({
        type: 'volume_surge',
        severity: 'info',
        message: `High volume of mentions (${totalMentions}) for ${symbol}`,
      });
    }
    
    // High credibility source alerts
    const highCredibilityNews = articles.filter(a => 
      a.credibilityScore > 0.8 && a.classification.importance === 'critical'
    );
    
    if (highCredibilityNews.length > 0) {
      alerts.push({
        type: 'credible_source',
        severity: 'critical',
        message: `Critical news from high credibility sources about ${symbol}`,
      });
    }
    
    // Regulatory alerts
    const regulatoryNews = articles.filter(a => a.classification.category === 'regulation');
    if (regulatoryNews.length > 0) {
      alerts.push({
        type: 'regulatory',
        severity: 'critical',
        message: `Regulatory news detected for ${symbol}`,
      });
    }
    
    // Whale activity (based on high-influence posts)
    const whaleActivity = posts.filter(p => p.influence > 0.8 && p.author.followers > 1000000);
    if (whaleActivity.length > 0) {
      alerts.push({
        type: 'whale_activity',
        severity: 'warning',
        message: `High-influence accounts discussing ${symbol}`,
      });
    }
    
    return alerts;
  }

  // Utility functions
  private getRecentArticles(symbol: string, hoursBack: number): NewsArticle[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    return Array.from(this.articles.values()).filter(article => 
      article.publishedAt > cutoff && 
      (article.symbols.includes(symbol) || 
       article.title.toUpperCase().includes(symbol) ||
       article.content.toUpperCase().includes(symbol))
    );
  }

  private getRecentSocialPosts(symbol: string, hoursBack: number): SocialMediaPost[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    return Array.from(this.socialPosts.values()).filter(post => 
      post.timestamp > cutoff && 
      (post.mentions.includes(symbol) || 
       post.content.toUpperCase().includes(symbol) ||
       post.content.toUpperCase().includes('$' + symbol))
    );
  }

  private async generateSummary(content: string): Promise<string> {
    // Mock implementation - would use actual summarization model
    const sentences = content.split('.').filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('.') + '.';
  }

  private async analyzeSocialPostSentiment(content: string): Promise<{ score: number; confidence: number }> {
    return this.calculateRuleBasedSentiment(content);
  }

  // Trending topics detection
  public detectTrendingTopics(timeframeMinutes: number = 60): TrendingTopic[] {
    const cutoff = Date.now() - (timeframeMinutes * 60 * 1000);
    
    const recentArticles = Array.from(this.articles.values()).filter(a => a.publishedAt > cutoff);
    const recentPosts = Array.from(this.socialPosts.values()).filter(p => p.timestamp > cutoff);
    
    // Combine keywords and mentions
    const topicCounts: { [topic: string]: { count: number; sentiment: number; symbols: Set<string>; sources: Set<string> } } = {};
    
    // Process articles
    recentArticles.forEach(article => {
      article.keywords.forEach(keyword => {
        if (!topicCounts[keyword]) {
          topicCounts[keyword] = { count: 0, sentiment: 0, symbols: new Set(), sources: new Set() };
        }
        topicCounts[keyword].count++;
        topicCounts[keyword].sentiment += article.sentiment.overall;
        article.symbols.forEach(s => topicCounts[keyword].symbols.add(s));
        topicCounts[keyword].sources.add(article.source.name);
      });
    });
    
    // Process social posts
    recentPosts.forEach(post => {
      const words = post.content.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      words.forEach(word => {
        if (!topicCounts[word]) {
          topicCounts[word] = { count: 0, sentiment: 0, symbols: new Set(), sources: new Set() };
        }
        topicCounts[word].count++;
        topicCounts[word].sentiment += post.sentiment.score;
        post.mentions.forEach(s => topicCounts[word].symbols.add(s));
        topicCounts[word].sources.add(post.platform);
      });
    });
    
    // Calculate trends
    const trends: TrendingTopic[] = Object.entries(topicCounts)
      .filter(([topic, data]) => data.count >= 3) // Minimum mentions
      .map(([topic, data]) => ({
        topic,
        mentions: data.count,
        sentiment: data.sentiment / data.count,
        velocity: data.count / timeframeMinutes, // Mentions per minute
        symbols: Array.from(data.symbols),
        timeframe: timeframeMinutes,
        sources: Array.from(data.sources),
      }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 20); // Top 20 trends
    
    this.trendingTopics = trends;
    return trends;
  }

  // Real-time monitoring
  private startRealTimeMonitoring() {
    // Simulate real-time news feed
    setInterval(() => {
      this.fetchLatestNews();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Simulate social media monitoring
    setInterval(() => {
      this.fetchLatestSocialPosts();
    }, 2 * 60 * 1000); // Every 2 minutes
    
    // Update trending topics
    setInterval(() => {
      this.detectTrendingTopics();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  private async fetchLatestNews() {
    // Mock implementation - would call actual news APIs
    Array.from(this.newsSources.values()).forEach(async (source) => {
      if (!source.isActive) return;
      
      try {
        const mockArticles = this.generateMockNews(source);
        for (const article of mockArticles) {
          await this.processNewsArticle(article, source);
        }
      } catch (error) {
        console.error(`Error fetching news from ${source.name}:`, error);
      }
    });
  }

  private async fetchLatestSocialPosts() {
    // Mock implementation - would call social media APIs
    const platforms = ['twitter', 'reddit'];
    
    for (const platform of platforms) {
      try {
        const mockPosts = this.generateMockSocialPosts(platform);
        for (const post of mockPosts) {
          await this.processSocialPost(post, platform);
        }
      } catch (error) {
        console.error(`Error fetching posts from ${platform}:`, error);
      }
    }
  }

  // Mock data generation for testing
  private generateMockNews(source: NewsSource) {
    const mockArticles = [];
    const symbols = ['BTC', 'ETH', 'BNB'];
    
    for (let i = 0; i < Math.random() * 3; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      mockArticles.push({
        title: `${symbol} ${Math.random() > 0.5 ? 'surges' : 'drops'} amid market ${Math.random() > 0.5 ? 'optimism' : 'concerns'}`,
        content: `Market analysis shows ${symbol} is experiencing significant movement...`,
        url: `https://example.com/article/${Date.now()}`,
        publishedAt: new Date().toISOString(),
        author: 'Test Author',
      });
    }
    
    return mockArticles;
  }

  private generateMockSocialPosts(platform: string) {
    const mockPosts = [];
    const symbols = ['BTC', 'ETH', 'BNB'];
    
    for (let i = 0; i < Math.random() * 5; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      mockPosts.push({
        content: `$${symbol} looking ${Math.random() > 0.5 ? 'bullish' : 'bearish'} today!`,
        timestamp: new Date().toISOString(),
        author: {
          username: 'cryptotrader' + Math.floor(Math.random() * 1000),
          followers: Math.floor(Math.random() * 100000),
          verified: Math.random() > 0.8,
        },
        likes: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50),
      });
    }
    
    return mockPosts;
  }

  // Cleanup functions
  private cleanOldArticles() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    this.articles.forEach((article, id) => {
      if (article.publishedAt < cutoff) {
        this.articles.delete(id);
      }
    });
  }

  private cleanOldSocialPosts() {
    const cutoff = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days
    
    this.socialPosts.forEach((post, id) => {
      if (post.timestamp < cutoff) {
        this.socialPosts.delete(id);
      }
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Public API methods
  public getSentimentHistory(symbol: string, limit: number = 100): SentimentSignal[] {
    const history = this.sentimentHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  public getTrendingTopics(): TrendingTopic[] {
    return [...this.trendingTopics];
  }

  public getRecentNews(symbol: string, hours: number = 24): NewsArticle[] {
    return this.getRecentArticles(symbol, hours);
  }

  public subscribeToSentimentSignals(callback: (signal: SentimentSignal) => void) {
    this.on('sentimentSignal', callback);
  }

  public addNewsSource(source: NewsSource) {
    this.newsSources.set(source.id, source);
  }

  public removeNewsSource(sourceId: string) {
    this.newsSources.delete(sourceId);
  }
}

export const newsSentimentAnalyzer = new NewsSentimentAnalyzer();
