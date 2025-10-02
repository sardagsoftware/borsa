import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Binance public API - no authentication needed for price data
const BINANCE_API = 'https://api.binance.com/api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';

  try {
    // Fetch ticker data from Binance
    const [tickerRes, klineRes] = await Promise.all([
      fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`),
      fetch(`${BINANCE_API}/klines?symbol=${symbol}&interval=1m&limit=1`)
    ]);

    if (!tickerRes.ok || !klineRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch Binance data' },
        { status: 500 }
      );
    }

    const ticker = await tickerRes.json();
    const kline = await klineRes.json();

    // Process the data
    const currentPrice = parseFloat(ticker.lastPrice);
    const priceChange24h = parseFloat(ticker.priceChangePercent);
    const volume24h = parseFloat(ticker.volume);
    const high24h = parseFloat(ticker.highPrice);
    const low24h = parseFloat(ticker.lowPrice);

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        price: currentPrice,
        change24h: priceChange24h,
        volume: volume24h,
        high24h,
        low24h,
        timestamp: Date.now(),
        // Latest candle data
        candle: {
          open: parseFloat(kline[0][1]),
          high: parseFloat(kline[0][2]),
          low: parseFloat(kline[0][3]),
          close: parseFloat(kline[0][4]),
          volume: parseFloat(kline[0][5])
        }
      }
    });

  } catch (error) {
    console.error('Binance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
