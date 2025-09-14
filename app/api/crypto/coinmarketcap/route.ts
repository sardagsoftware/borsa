import { NextRequest, NextResponse } from 'next/server';

// CoinMarketCap API Configuration
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

// Rate limiting ve cache için
const CACHE_DURATION = 60000; // 1 minute cache
let lastFetch = 0;
let cachedData: any = null;

interface CoinMarketCapResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: {
    [key: string]: {
      id: number;
      name: string;
      symbol: string;
      slug: string;
      num_market_pairs: number;
      date_added: string;
      tags: string[];
      max_supply: number | null;
      circulating_supply: number;
      total_supply: number;
      platform: any;
      cmc_rank: number;
      self_reported_circulating_supply: number | null;
      self_reported_market_cap: number | null;
      tvl_ratio: number | null;
      last_updated: string;
      quote: {
        USD: {
          price: number;
          volume_24h: number;
          volume_change_24h: number;
          percent_change_1h: number;
          percent_change_24h: number;
          percent_change_7d: number;
          percent_change_30d: number;
          percent_change_60d: number;
          percent_change_90d: number;
          market_cap: number;
          market_cap_dominance: number;
          fully_diluted_market_cap: number;
          tvl: number | null;
          last_updated: string;
        };
      };
    };
  };
}

// Top 100 Coin List from CoinMarketCap
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const convert = url.searchParams.get('convert') || 'USD';
    
    // Cache kontrolü
    const now = Date.now();
    if (cachedData && (now - lastFetch) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheAge: now - lastFetch
      });
    }

    if (!CMC_API_KEY) {
      // Fallback mock data for development
      return NextResponse.json(generateMockCMCData(limit));
    }

    // CoinMarketCap API çağrısı
    const response = await fetch(
      `${CMC_BASE_URL}/cryptocurrency/listings/latest?start=1&limit=${limit}&convert=${convert}`,
      {
        method: 'GET',
        headers: {
          'Accepts': 'application/json',
          'X-CMC_PRO_API_KEY': CMC_API_KEY,
          'Accept-Encoding': 'deflate, gzip'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data: CoinMarketCapResponse = await response.json();
    
    if (data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
    }

    // Veriyi formatla
    const formattedData = {
      success: true,
      source: 'coinmarketcap',
      timestamp: new Date().toISOString(),
      total_cryptocurrencies: Object.keys(data.data).length,
      data: Object.values(data.data).map((coin, index) => ({
        rank: coin.cmc_rank || (index + 1),
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        slug: coin.slug,
        price: coin.quote.USD.price,
        price_change_1h: coin.quote.USD.percent_change_1h,
        price_change_24h: coin.quote.USD.percent_change_24h,
        price_change_7d: coin.quote.USD.percent_change_7d,
        price_change_30d: coin.quote.USD.percent_change_30d,
        market_cap: coin.quote.USD.market_cap,
        market_cap_dominance: coin.quote.USD.market_cap_dominance,
        volume_24h: coin.quote.USD.volume_24h,
        volume_change_24h: coin.quote.USD.volume_change_24h,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        fully_diluted_market_cap: coin.quote.USD.fully_diluted_market_cap,
        last_updated: coin.quote.USD.last_updated,
        tags: coin.tags,
        num_market_pairs: coin.num_market_pairs
      }))
    };

    // Cache'e kaydet
    cachedData = formattedData;
    lastFetch = now;

    return NextResponse.json(formattedData, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('CoinMarketCap API Error:', error);
    
    // Hata durumunda fallback data
    return NextResponse.json(generateMockCMCData(100), {
      status: 200, // Frontend'de sorun çıkarmasın diye
      headers: {
        'Cache-Control': 'public, max-age=30'
      }
    });
  }
}

// Mock data generator for development
function generateMockCMCData(limit: number = 100) {
  const topCoins = [
    { name: 'Bitcoin', symbol: 'BTC' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'BNB', symbol: 'BNB' },
    { name: 'Solana', symbol: 'SOL' },
    { name: 'XRP', symbol: 'XRP' },
    { name: 'Cardano', symbol: 'ADA' },
    { name: 'Avalanche', symbol: 'AVAX' },
    { name: 'Dogecoin', symbol: 'DOGE' },
    { name: 'Polkadot', symbol: 'DOT' },
    { name: 'Chainlink', symbol: 'LINK' }
  ];

  const mockData = [];
  
  for (let i = 0; i < Math.min(limit, 100); i++) {
    const coin = topCoins[i % topCoins.length];
    const basePrice = Math.random() * 1000 + 1;
    const change24h = (Math.random() - 0.5) * 20; // -10% to +10%
    
    mockData.push({
      rank: i + 1,
      id: i + 1,
      name: coin.name + (i >= topCoins.length ? ` ${Math.floor(i / topCoins.length) + 1}` : ''),
      symbol: coin.symbol + (i >= topCoins.length ? Math.floor(i / topCoins.length) + 1 : ''),
      slug: (coin.name.toLowerCase() + (i >= topCoins.length ? `-${Math.floor(i / topCoins.length) + 1}` : '')).replace(' ', '-'),
      price: basePrice,
      price_change_1h: (Math.random() - 0.5) * 4,
      price_change_24h: change24h,
      price_change_7d: (Math.random() - 0.5) * 30,
      price_change_30d: (Math.random() - 0.5) * 60,
      market_cap: basePrice * (Math.random() * 1000000 + 100000),
      market_cap_dominance: Math.random() * 50,
      volume_24h: basePrice * (Math.random() * 10000 + 1000),
      volume_change_24h: (Math.random() - 0.5) * 50,
      circulating_supply: Math.random() * 1000000 + 10000,
      total_supply: Math.random() * 1500000 + 10000,
      max_supply: Math.random() > 0.3 ? Math.random() * 2000000 + 10000 : null,
      fully_diluted_market_cap: basePrice * (Math.random() * 1200000 + 100000),
      last_updated: new Date().toISOString(),
      tags: ['cryptocurrency', 'blockchain'],
      num_market_pairs: Math.floor(Math.random() * 500 + 10)
    });
  }

  return {
    success: true,
    source: 'mock_data',
    timestamp: new Date().toISOString(),
    total_cryptocurrencies: mockData.length,
    data: mockData,
    note: 'This is mock data for development. Set COINMARKETCAP_API_KEY environment variable for live data.'
  };
}
