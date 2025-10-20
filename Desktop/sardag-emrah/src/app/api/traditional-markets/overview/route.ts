/**
 * TRADITIONAL MARKETS OVERVIEW API
 *
 * Multi-source data aggregation:
 * - Binance Spot API (Forex, PAXG Gold)
 * - MetalpriceAPI (Silver, Platinum)
 * - Yahoo Finance (BIST100, Indices)
 */

import { NextResponse } from 'next/server';
import { getEnabledTraditionalMarkets, type TraditionalMarketData } from '@/types/traditional-markets';
import { getMetalPrice, generateSparkline as generateMetalSparkline, estimateChange24h } from '@/lib/adapters/metalpriceapi';
import { getYahooQuote, generateSparkline as generateYahooSparkline } from '@/lib/adapters/yahoo-finance';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface BinanceSpotTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

interface BinanceSpotKline {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
}

/**
 * Fetch market data from Binance Spot API
 */
async function fetchBinanceSpotData(symbol: string): Promise<TraditionalMarketData | null> {
  try {
    // 1. Get 24h ticker data
    const tickerResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      {
        next: { revalidate: 10 }, // Cache for 10 seconds
      }
    );

    if (!tickerResponse.ok) {
      console.error(`[Traditional Markets] Failed to fetch ticker for ${symbol}`);
      return null;
    }

    const ticker: BinanceSpotTicker = await tickerResponse.json();

    // 2. Get sparkline data (last 24h, 1h candles)
    const klinesResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`,
      {
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    let sparkline: number[] = [];
    if (klinesResponse.ok) {
      const klines: BinanceSpotKline[] = await klinesResponse.json();
      sparkline = klines.map((k) => parseFloat(k[4])); // Close prices
    }

    // 3. Calculate 7d change (approximate from 24h)
    // Note: Binance Spot doesn't provide 7d data directly
    // We'll use 24h as approximation for now
    const changePercent7d = parseFloat(ticker.priceChangePercent) * 7; // Rough estimate

    const marketData: TraditionalMarketData = {
      symbol: ticker.symbol,
      name: ticker.symbol,
      type: 'FOREX', // Will be set by caller
      price: parseFloat(ticker.lastPrice),
      changePercent24h: parseFloat(ticker.priceChangePercent),
      changePercent7d: changePercent7d,
      volume24h: parseFloat(ticker.volume),
      sparkline: sparkline,
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      lastUpdate: Date.now(),
    };

    return marketData;
  } catch (error) {
    console.error(`[Traditional Markets] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch precious metals data from MetalpriceAPI
 */
async function fetchMetalPrice(symbol: 'XAG' | 'XPT'): Promise<TraditionalMarketData | null> {
  try {
    const price = await getMetalPrice(symbol);
    if (!price) return null;

    const changePercent24h = estimateChange24h(price);
    const sparkline = generateMetalSparkline(price, 24);

    return {
      symbol: symbol,
      name: symbol === 'XAG' ? 'Silver' : 'Platinum',
      type: 'COMMODITY',
      price: price,
      changePercent24h: changePercent24h,
      changePercent7d: changePercent24h * 7, // Estimate
      volume24h: 0, // Not available in free tier
      sparkline: sparkline,
      high24h: price * 1.02,
      low24h: price * 0.98,
      lastUpdate: Date.now(),
    };
  } catch (error) {
    console.error(`[MetalpriceAPI] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch index data from Yahoo Finance
 */
async function fetchYahooIndex(symbol: string): Promise<TraditionalMarketData | null> {
  try {
    const quote = await getYahooQuote(symbol);
    if (!quote || !quote.regularMarketPrice) return null;

    const price = quote.regularMarketPrice;
    const changePercent = quote.regularMarketChangePercent || 0;
    const sparkline = generateYahooSparkline(price, changePercent, 24);

    return {
      symbol: symbol,
      name: symbol,
      type: 'INDEX',
      price: price,
      changePercent24h: changePercent,
      changePercent7d: changePercent * 7, // Estimate
      volume24h: quote.regularMarketVolume || 0,
      sparkline: sparkline,
      high24h: quote.regularMarketDayHigh || price * 1.02,
      low24h: quote.regularMarketDayLow || price * 0.98,
      lastUpdate: Date.now(),
    };
  } catch (error) {
    console.error(`[Yahoo Finance] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * GET /api/traditional-markets/overview
 */
export async function GET() {
  try {
    console.log('[Traditional Markets] Fetching overview data...');

    const enabledMarkets = getEnabledTraditionalMarkets();
    const marketDataPromises = enabledMarkets.map(async (marketConfig) => {
      let data: TraditionalMarketData | null = null;

      // Route to appropriate API based on symbol
      if (marketConfig.binanceSymbol === 'XAG' || marketConfig.binanceSymbol === 'XPT') {
        // Precious metals from MetalpriceAPI
        data = await fetchMetalPrice(marketConfig.binanceSymbol as 'XAG' | 'XPT');
      } else if (marketConfig.binanceSymbol === 'XU100.IS' || marketConfig.type === 'INDEX') {
        // Indices from Yahoo Finance
        data = await fetchYahooIndex(marketConfig.binanceSymbol);
      } else {
        // Forex and PAXG from Binance
        data = await fetchBinanceSpotData(marketConfig.binanceSymbol);
      }

      if (!data) return null;

      // Enhance with metadata
      return {
        ...data,
        symbol: marketConfig.symbol, // Use friendly symbol
        name: marketConfig.name,
        type: marketConfig.type,
        icon: marketConfig.icon,
        category: marketConfig.category,
        description: marketConfig.description,
      } as TraditionalMarketData;
    });

    const results = await Promise.all(marketDataPromises);
    const marketData = results.filter((d): d is TraditionalMarketData => d !== null);

    console.log(`[Traditional Markets] Fetched ${marketData.length}/${enabledMarkets.length} markets`);

    return NextResponse.json({
      success: true,
      count: marketData.length,
      data: marketData,
      sources: {
        binance: 'Forex, PAXG Gold',
        metalpriceapi: 'Silver, Platinum',
        yahoo: 'BIST100, Indices',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Traditional Markets] Overview API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch traditional markets data',
        data: [],
      },
      { status: 500 }
    );
  }
}
