import type { Candle } from "@/types/ohlc";

export type SRLevel = {
  price: number;
  type: "support" | "resistance";
  strength: number; // 1-5, kaç kez test edildi
  touches: number; // Fiyatın bu seviyeye kaç kez yaklaştığı
};

/**
 * Destek ve Direnç seviyelerini hesaplar
 * Pivot High/Low yöntemini kullanır
 */
export function calculateSupportResistance(
  candles: Candle[],
  lookback: number = 20,
  tolerance: number = 0.002 // %0.2 tolerans
): SRLevel[] {
  if (candles.length < lookback * 2) return [];

  const levels: SRLevel[] = [];
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  // Pivot High ve Pivot Low noktalarını bul
  for (let i = lookback; i < candles.length - lookback; i++) {
    const candle = candles[i];
    let isPivotHigh = true;
    let isPivotLow = true;

    // Lookback periyodu içinde en yüksek/düşük mü kontrol et
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j].high > candle.high) isPivotHigh = false;
      if (candles[j].low < candle.low) isPivotLow = false;
    }

    if (isPivotHigh) pivotHighs.push(candle.high);
    if (isPivotLow) pivotLows.push(candle.low);
  }

  // Benzer seviyeleri grupla - Resistance
  const resistanceClusters = clusterLevels(pivotHighs, tolerance);
  resistanceClusters.forEach(cluster => {
    levels.push({
      price: cluster.avgPrice,
      type: "resistance",
      strength: Math.min(5, cluster.count),
      touches: cluster.count
    });
  });

  // Benzer seviyeleri grupla - Support
  const supportClusters = clusterLevels(pivotLows, tolerance);
  supportClusters.forEach(cluster => {
    levels.push({
      price: cluster.avgPrice,
      type: "support",
      strength: Math.min(5, cluster.count),
      touches: cluster.count
    });
  });

  // Güce göre sırala ve en güçlü 8 seviyeyi döndür
  return levels
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);
}

/**
 * Yakın seviyeleri gruplar
 */
function clusterLevels(prices: number[], tolerance: number): Array<{ avgPrice: number; count: number }> {
  if (prices.length === 0) return [];

  const clusters: Array<{ prices: number[] }> = [];

  prices.forEach(price => {
    // Bu fiyata yakın bir cluster var mı?
    let foundCluster = false;
    for (const cluster of clusters) {
      const avgPrice = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
      const diff = Math.abs(price - avgPrice) / avgPrice;

      if (diff <= tolerance) {
        cluster.prices.push(price);
        foundCluster = true;
        break;
      }
    }

    if (!foundCluster) {
      clusters.push({ prices: [price] });
    }
  });

  return clusters
    .filter(c => c.prices.length >= 2) // En az 2 kez test edilmiş olmalı
    .map(c => ({
      avgPrice: c.prices.reduce((a, b) => a + b, 0) / c.prices.length,
      count: c.prices.length
    }));
}

/**
 * Fibonacci Retracement seviyelerini hesaplar
 */
export function calculateFibonacciLevels(candles: Candle[]): SRLevel[] {
  if (candles.length < 20) return [];

  // Son swing high ve swing low'u bul
  const recentCandles = candles.slice(-100); // Son 100 mum
  const high = Math.max(...recentCandles.map(c => c.high));
  const low = Math.min(...recentCandles.map(c => c.low));
  const diff = high - low;

  const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
  const levels: SRLevel[] = [];

  fibLevels.forEach(fib => {
    const price = low + (diff * fib);
    levels.push({
      price,
      type: fib > 0.5 ? "resistance" : "support",
      strength: 3,
      touches: 1
    });
  });

  return levels;
}

/**
 * Güncel fiyata göre en yakın destek ve direnç seviyelerini döndürür
 */
export function getNearestLevels(
  levels: SRLevel[],
  currentPrice: number
): { nearestSupport: SRLevel | null; nearestResistance: SRLevel | null } {
  const supports = levels.filter(l => l.type === "support" && l.price < currentPrice);
  const resistances = levels.filter(l => l.type === "resistance" && l.price > currentPrice);

  const nearestSupport = supports.length > 0
    ? supports.reduce((a, b) => Math.abs(a.price - currentPrice) < Math.abs(b.price - currentPrice) ? a : b)
    : null;

  const nearestResistance = resistances.length > 0
    ? resistances.reduce((a, b) => Math.abs(a.price - currentPrice) < Math.abs(b.price - currentPrice) ? a : b)
    : null;

  return { nearestSupport, nearestResistance };
}
