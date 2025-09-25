import axios from 'axios';

// API Configuration
const config = {
  alphavantage: {
    baseUrl: 'https://www.alphavantage.co/query',
    key: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo'
  },
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    key: process.env.NEXT_PUBLIC_FINNHUB_KEY || 'demo'
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    // CoinGecko free tier doesn't require API key
  },
  newsapi: {
    baseUrl: 'https://newsapi.org/v2',
    key: process.env.NEXT_PUBLIC_NEWS_API_KEY || 'demo'
  }
};

// Rate limiting helper
const rateLimiter = {
  lastCall: 0,
  minInterval: 1000, // 1 second between calls
  
  async wait() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }
    
    this.lastCall = Date.now();
  }
};

// Real-time Stock Data (Finnhub API)
export async function fetchRealTimeStocks() {
  await rateLimiter.wait();
  
  try {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
    const promises = symbols.map(async (symbol) => {
      try {
        // Get quote data
        const quoteResponse = await axios.get(`${config.finnhub.baseUrl}/quote`, {
          params: {
            symbol: symbol,
            token: config.finnhub.key
          }
        });
        
        // Get company profile
        const profileResponse = await axios.get(`${config.finnhub.baseUrl}/stock/profile2`, {
          params: {
            symbol: symbol,
            token: config.finnhub.key
          }
        });
        
        const quote = quoteResponse.data;
        const profile = profileResponse.data;
        
        if (!quote.c) return null; // Skip if no current price
        
        return {
          symbol: symbol,
          name: profile.name || symbol,
          price: quote.c,
          change: quote.d || 0,
          changePercent: quote.dp || 0,
          volume: 0, // Finnhub doesn't provide volume in quote
          marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1000000 : 0,
          pe: 0, // Would need additional API call
          dividendYield: 0, // Would need additional API call
          high52Week: quote.h || 0,
          low52Week: quote.l || 0,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.warn(`Failed to fetch data for ${symbol}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter(Boolean);
    
  } catch (error) {
    console.error('Failed to fetch real-time stocks:', error);
    throw error;
  }
}

// Real-time Crypto Data (CoinGecko API)
export async function fetchRealTimeCryptos() {
  await rateLimiter.wait();
  
  try {
    const response = await axios.get(`${config.coingecko.baseUrl}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 20,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    
    return response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.current_price,
      change: coin.price_change_24h || 0,
      changePercent: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
      marketCapRank: coin.market_cap_rank || 0,
      circulatingSupply: coin.circulating_supply || 0,
      totalSupply: coin.total_supply || 0,
      high24h: coin.high_24h || 0,
      low24h: coin.low_24h || 0,
      ath: coin.ath || 0,
      athDate: coin.ath_date || new Date().toISOString(),
      lastUpdated: coin.last_updated || new Date().toISOString(),
    }));
    
  } catch (error) {
    console.error('Failed to fetch real-time cryptos:', error);
    throw error;
  }
}

// Market Summary
export async function fetchMarketSummary() {
  await rateLimiter.wait();
  
  try {
    const response = await axios.get(`${config.coingecko.baseUrl}/global`);
    const globalData = response.data.data;
    
    return {
      totalMarketCap: globalData.total_market_cap?.usd || 0,
      totalVolume24h: globalData.total_volume?.usd || 0,
      marketCapChange24h: globalData.market_cap_change_percentage_24h_usd || 0,
      activeCurrencies: globalData.active_cryptocurrencies || 0,
      totalExchanges: globalData.markets || 0,
      btcDominance: globalData.market_cap_percentage?.btc || 0,
      lastUpdated: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error('Failed to fetch market summary:', error);
    throw error;
  }
}

// Financial News (NewsAPI)
export async function fetchFinancialNews(category = 'business', pageSize = 20) {
  await rateLimiter.wait();
  
  try {
    const response = await axios.get(`${config.newsapi.baseUrl}/top-headlines`, {
      params: {
        category: category,
        country: 'us',
        pageSize: pageSize,
        apiKey: config.newsapi.key
      }
    });
    
    return response.data.articles.map((article: any, index: number) => ({
      id: `news_${index}`,
      title: article.title,
      summary: article.description || '',
      content: article.content || '',
      source: article.source.name,
      publishedAt: article.publishedAt,
      category: 'markets',
      tags: extractTagsFromTitle(article.title),
      imageUrl: article.urlToImage,
      url: article.url,
      sentiment: analyzeSentiment(article.title + ' ' + article.description)
    }));
    
  } catch (error) {
    console.error('Failed to fetch financial news:', error);
    throw error;
  }
}

// Helper function to extract tags from title
function extractTagsFromTitle(title: string): string[] {
  const commonStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META'];
  const commonCryptos = ['Bitcoin', 'Ethereum', 'BTC', 'ETH'];
  const financialTerms = ['Fed', 'inflation', 'interest rates', 'market', 'stocks'];
  
  const tags: string[] = [];
  const titleUpper = title.toUpperCase();
  
  commonStocks.forEach(stock => {
    if (titleUpper.includes(stock)) tags.push(stock);
  });
  
  commonCryptos.forEach(crypto => {
    if (titleUpper.includes(crypto.toUpperCase())) tags.push(crypto);
  });
  
  financialTerms.forEach(term => {
    if (titleUpper.includes(term.toUpperCase())) tags.push(term);
  });
  
  return tags;
}

// Simple sentiment analysis
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['up', 'gain', 'rise', 'surge', 'bull', 'growth', 'profit', 'success', 'strong'];
  const negativeWords = ['down', 'fall', 'drop', 'crash', 'bear', 'loss', 'decline', 'weak'];
  
  const textLower = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Historical Price Data (Alpha Vantage)
export async function fetchHistoricalData(symbol: string, interval = 'daily') {
  await rateLimiter.wait();
  
  try {
    const response = await axios.get(config.alphavantage.baseUrl, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: config.alphavantage.key,
        outputsize: 'compact'
      }
    });
    
    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) return [];
    
    return Object.entries(timeSeries)
      .slice(0, 30)
      .map(([date, data]: [string, any]) => ({
        timestamp: new Date(date).toISOString(),
        price: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume'])
      }))
      .reverse();
      
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    return [];
  }
}