import { NextResponse } from "next/server";

type BinanceSymbol = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
};

let cachedSymbols: { symbol: string; label: string }[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedSymbols && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json({ symbols: cachedSymbols });
    }

    const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await response.json();

    // Filter USDT pairs and active symbols
    const symbols = data.symbols
      .filter((s: BinanceSymbol) => s.quoteAsset === "USDT" && s.status === "TRADING")
      .map((s: BinanceSymbol) => ({
        symbol: s.symbol,
        label: `${s.baseAsset}/USDT`,
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label));

    cachedSymbols = symbols;
    cacheTime = Date.now();

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error("Failed to fetch symbols:", error);
    return NextResponse.json({ error: "Failed to fetch symbols" }, { status: 500 });
  }
}
