import { NextResponse } from 'next/server';

// Cache for 60 seconds
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cache.data,
        cached: true,
        source: 'CoinGecko API (Top 100)'
      });
    }

    // Fetch top 100 cryptocurrencies from CoinGecko (free alternative to CoinMarketCap)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?' +
      'vs_currency=usd&' +
      'order=market_cap_desc&' +
      'per_page=100&' +
      'page=1&' +
      'sparkline=false&' +
      'price_change_percentage=1h,24h,7d'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API hatası: ${response.status}`);
    }

    const rawData = await response.json();

    // Transform data to match our format
    const data = rawData.map((coin: any, index: number) => ({
      id: coin.id,
      rank: index + 1,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
      priceChange24h: coin.price_change_percentage_24h || 0,
      priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      ath: coin.ath,
      athDate: coin.ath_date,
      atl: coin.atl,
      atlDate: coin.atl_date,
    }));

    // Update cache
    cache = {
      data,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      count: data.length,
      source: 'CoinGecko API (Top 100)',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('CoinMarketCap API route error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Top 100 kripto para verileri alınamadı',
        message: error.message
      },
      { status: 500 }
    );
  }
}