import { NextResponse } from "next/server";

type BinanceFuturesSymbol = {
  symbol: string;
  pair: string;
  contractType: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
};

let cache: { symbols: { symbol: string; label: string }[]; timestamp: number } | null = null;
const CACHE_TTL = 3600000; // 1 hour

export async function GET() {
  try {
    // Return cached data if available and fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ symbols: cache.symbols, source: "cache" });
    }

    const response = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");

    if (!response.ok) {
      throw new Error(`Binance Futures API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter for USDT perpetual futures only
    const symbols = data.symbols
      .filter((s: BinanceFuturesSymbol) =>
        s.quoteAsset === "USDT" &&
        s.status === "TRADING" &&
        s.contractType === "PERPETUAL"
      )
      .map((s: BinanceFuturesSymbol) => ({
        symbol: s.symbol,
        label: `${s.baseAsset}/USDT`,
      }))
      .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

    // Update cache
    cache = {
      symbols,
      timestamp: Date.now(),
    };

    return NextResponse.json({ symbols, source: "api" });
  } catch (error) {
    console.error("Futures symbols fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Binance Futures symbols" },
      { status: 500 }
    );
  }
}
