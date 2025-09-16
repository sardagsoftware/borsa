import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
// Binance API'den fiyat verilerini çek
async function fetchBinancePrices(symbols: string[]) {
  const symbolsQuery = symbols.map(s => `"${s}USDT"`).join(',');
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsQuery}]`;
  
  try {
    const response = await fetch(url, { 
      next: { revalidate: 5 }, // 5 saniye cache
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Binance API error');
    
    const data = await response.json();
    return data.map((item: any) => ({
      symbol: item.symbol.replace('USDT', ''),
      price: parseFloat(item.lastPrice),
      change: parseFloat(item.priceChange),
      changePercent: parseFloat(item.priceChangePercent),
      volume: parseFloat(item.volume),
      high: parseFloat(item.highPrice),
      low: parseFloat(item.lowPrice),
      source: 'Binance'
    }));
  } catch (error) {
    console.error('Binance API error:', error);
    return null;
  }
}

// CoinGecko API'den fiyat verilerini çek (fallback)
async function fetchCoinGeckoPrices(symbols: string[]) {
  const ids = symbols.map(s => s.toLowerCase()).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
  
  try {
    const response = await fetch(url, { 
      next: { revalidate: 10 }, // 10 saniye cache
    });
    
    if (!response.ok) throw new Error('CoinGecko API error');
    
    const data = await response.json();
    return Object.entries(data).map(([key, value]: [string, any]) => ({
      symbol: key.toUpperCase(),
      price: value.usd,
      change: null,
      changePercent: value.usd_24h_change,
      volume: value.usd_24h_vol,
      high: null,
      low: null,
      source: 'CoinGecko'
    }));
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return null;
  }
}

// Mock data for development/fallback
function getMockPrices(symbols: string[]) {
  const mockPrices: { [key: string]: { basePrice: number, name: string } } = {
    BTC: { basePrice: 65000, name: 'Bitcoin' },
    ETH: { basePrice: 3200, name: 'Ethereum' },
    BNB: { basePrice: 580, name: 'BNB' },
    ADA: { basePrice: 0.45, name: 'Cardano' },
    SOL: { basePrice: 140, name: 'Solana' },
    DOT: { basePrice: 7.5, name: 'Polkadot' },
    AVAX: { basePrice: 32, name: 'Avalanche' },
    MATIC: { basePrice: 0.85, name: 'Polygon' }
  };

  return symbols.map(symbol => {
    const baseData = mockPrices[symbol];
    if (!baseData) {
      return {
        symbol,
        price: Math.random() * 100,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 10,
        volume: Math.random() * 1000000,
        high: null,
        low: null,
        source: 'Mock'
      };
    }

    const volatility = (Math.random() - 0.5) * 0.05; // %5 volatilite
    const price = baseData.basePrice * (1 + volatility);
    const changePercent = (Math.random() - 0.5) * 8; // -4% ile +4% arası
    
    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat((price * changePercent / 100).toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.random() * 10000000,
      high: parseFloat((price * 1.02).toFixed(2)),
      low: parseFloat((price * 0.98).toFixed(2)),
      source: 'Mock'
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || 'BTC,ETH,BNB,ADA,SOL,DOT,AVAX,MATIC';
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  try {
    // İlk önce Binance API'yi dene
    let prices = await fetchBinancePrices(symbols);
    
    // Binance başarısız olursa CoinGecko'yu dene
    if (!prices) {
      prices = await fetchCoinGeckoPrices(symbols);
    }
    
    // Her ikisi de başarısız olursa mock data kullan
    if (!prices) {
      prices = getMockPrices(symbols);
    }

    // Response headers
    const response = NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
      source: prices[0]?.source || 'Unknown',
      count: prices.length
    });

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cache headers
    response.headers.set('Cache-Control', 'public, max-age=5, s-maxage=5');

    return response;

  } catch (error) {
    console.error('Crypto prices API error:', error);
    
    // Hata durumunda mock data döndür
    const mockPrices = getMockPrices(symbols);
    
    return NextResponse.json({
      success: true,
      data: mockPrices,
      timestamp: new Date().toISOString(),
      source: 'Mock',
      count: mockPrices.length,
      warning: 'Using mock data due to API error'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    // GET endpoint ile aynı logic
    const symbolsList = symbols.map((s: string) => s.trim().toUpperCase());
    
    let prices = await fetchBinancePrices(symbolsList);
    
    if (!prices) {
      prices = await fetchCoinGeckoPrices(symbolsList);
    }
    
    if (!prices) {
      prices = getMockPrices(symbolsList);
    }

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
      source: prices[0]?.source || 'Unknown',
      count: prices.length
    });

  } catch (error) {
    console.error('Crypto prices POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
