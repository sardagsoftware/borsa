import type { Candle } from "@/types/ohlc";

export type SwingSignal = "GÜÇLÜ AL" | "AL" | "NÖTR" | "SAT" | "GÜÇLÜ SAT";

export type SwingCandleWithSignal = Candle & {
  signal: SwingSignal;
  strength: number; // 0-100 arası sinyal gücü
  reasons: string[]; // Sinyal nedenleri
};

/**
 * SWING TRADE SİNYAL SİSTEMİ
 *
 * Kullanılan Göstergeler:
 * - EMA (50, 200) - Uzun vadeli trend
 * - MACD (12, 26, 9) - Momentum
 * - RSI (14) - Aşırı alım/satım (40/60 eşikleri)
 * - Bollinger Bands - Volatilite ve fiyat seviyeleri
 * - Hacim Analizi - Onay sinyali
 * - Candlestick Patterns - Dönüş formasyonları
 *
 * Swing Trading için önerilen timeframe'ler: 4h, 1d, 1w
 */
export function calculateSwingSignals(
  candles: Candle[],
  indicators: {
    ema50?: number[];
    ema200?: number[];
    macd?: { macd: number; signal: number; histogram: number }[];
    rsi?: number[];
    bb?: { upper: number; middle: number; lower: number }[];
  }
): SwingCandleWithSignal[] {
  return candles.map((candle, i) => {
    let score = 0; // -10 to +10
    const reasons: string[] = [];
    const { ema50, ema200, macd, rsi, bb } = indicators;

    // 1. TREND ANALİZİ - Golden/Death Cross (EMA 50/200)
    if (ema50 && ema200 && ema50[i] && ema200[i]) {
      const prevEma50 = ema50[i - 1];
      const prevEma200 = ema200[i - 1];

      // Golden Cross (Boğa Sinyali)
      if (prevEma50 && prevEma200 && prevEma50 <= prevEma200 && ema50[i] > ema200[i]) {
        score += 4;
        reasons.push("🟡 Golden Cross - EMA50 yukarı kesti");
      }
      // Death Cross (Ayı Sinyali)
      else if (prevEma50 && prevEma200 && prevEma50 >= prevEma200 && ema50[i] < ema200[i]) {
        score -= 4;
        reasons.push("⚫ Death Cross - EMA50 aşağı kesti");
      }
      // Trend yönü
      else if (ema50[i] > ema200[i]) {
        score += 1;
        reasons.push("📈 Yükseliş trendi (EMA50 > EMA200)");
      } else {
        score -= 1;
        reasons.push("📉 Düşüş trendi (EMA50 < EMA200)");
      }

      // Fiyatın EMA'lara göre konumu
      if (candle.close > ema50[i] && candle.close > ema200[i]) {
        score += 1;
        reasons.push("✅ Fiyat her iki EMA üzerinde");
      } else if (candle.close < ema50[i] && candle.close < ema200[i]) {
        score -= 1;
        reasons.push("❌ Fiyat her iki EMA altında");
      }
    }

    // 2. MOMENTUM - MACD
    if (macd && macd[i]) {
      const currentMACD = macd[i];
      const prevMACD = macd[i - 1];

      // MACD Crossover (Alım Sinyali)
      if (prevMACD && prevMACD.macd <= prevMACD.signal && currentMACD.macd > currentMACD.signal) {
        score += 3;
        reasons.push("🚀 MACD Alım Kesişimi");
      }
      // MACD Crossunder (Satım Sinyali)
      else if (prevMACD && prevMACD.macd >= prevMACD.signal && currentMACD.macd < currentMACD.signal) {
        score -= 3;
        reasons.push("⚠️ MACD Satım Kesişimi");
      }

      // Histogram Momentum
      if (currentMACD.histogram > 0 && prevMACD && currentMACD.histogram > prevMACD.histogram) {
        score += 1;
        reasons.push("💪 Pozitif momentum artıyor");
      } else if (currentMACD.histogram < 0 && prevMACD && currentMACD.histogram < prevMACD.histogram) {
        score -= 1;
        reasons.push("⚡ Negatif momentum artıyor");
      }
    }

    // 3. ASIRI ALIM/SATIM - RSI (Swing için 40/60 eşikleri)
    if (rsi && rsi[i] !== undefined) {
      const rsiVal = rsi[i];
      const prevRSI = rsi[i - 1];

      if (rsiVal < 30) {
        score += 3;
        reasons.push("🔥 Aşırı Satım Bölgesi (RSI < 30)");
      } else if (rsiVal < 40) {
        score += 2;
        reasons.push("⚠️ Satım Baskısı (RSI < 40)");
      } else if (rsiVal > 70) {
        score -= 3;
        reasons.push("🔥 Aşırı Alım Bölgesi (RSI > 70)");
      } else if (rsiVal > 60) {
        score -= 2;
        reasons.push("⚠️ Alım Baskısı (RSI > 60)");
      }

      // RSI Divergence
      if (prevRSI && i > 1) {
        const priceTrend = candle.close - candles[i - 2].close;
        const rsiTrend = rsiVal - rsi[i - 2];

        // Bullish Divergence
        if (priceTrend < 0 && rsiTrend > 0 && rsiVal < 40) {
          score += 2;
          reasons.push("🎯 Bullish Divergence - Dönüş sinyali");
        }
        // Bearish Divergence
        if (priceTrend > 0 && rsiTrend < 0 && rsiVal > 60) {
          score -= 2;
          reasons.push("🎯 Bearish Divergence - Dönüş sinyali");
        }
      }
    }

    // 4. BOLLINGER BANDS - Volatilite ve Fiyat Seviyeleri
    if (bb && bb[i]) {
      const band = bb[i];
      const bandWidth = band.upper - band.lower;
      const pricePosition = (candle.close - band.lower) / bandWidth;

      // Alt banda yakın (Potansiyel Alım)
      if (candle.close <= band.lower) {
        score += 2;
        reasons.push("📊 Alt Bollinger Band'de - Aşırı satım");
      } else if (pricePosition < 0.2) {
        score += 1;
        reasons.push("📊 Alt banda yakın");
      }

      // Üst banda yakın (Potansiyel Satım)
      if (candle.close >= band.upper) {
        score -= 2;
        reasons.push("📊 Üst Bollinger Band'de - Aşırı alım");
      } else if (pricePosition > 0.8) {
        score -= 1;
        reasons.push("📊 Üst banda yakın");
      }

      // Bollinger Squeeze (Düşük volatilite - büyük hareket bekleniyor)
      if (i > 20) {
        const avgBandWidth = candles.slice(i - 20, i).reduce((sum, _, idx) => {
          const prevBand = bb[i - 20 + idx];
          return sum + (prevBand ? prevBand.upper - prevBand.lower : 0);
        }, 0) / 20;

        if (bandWidth < avgBandWidth * 0.7) {
          reasons.push("⚡ Bollinger Squeeze - Büyük hareket yakın");
        }
      }
    }

    // 5. HACİM ANALİZİ - Onay Sinyali
    if (i > 20) {
      const avgVolume = candles.slice(i - 20, i).reduce((sum, c) => sum + c.volume, 0) / 20;
      const volumeRatio = candle.volume / avgVolume;

      if (volumeRatio > 2) {
        // Yüksek hacim var, sinyal gücünü artır
        if (score > 0) {
          score += 1;
          reasons.push("🔊 Yüksek hacim - Alım onayı");
        } else if (score < 0) {
          score -= 1;
          reasons.push("🔊 Yüksek hacim - Satım onayı");
        }
      } else if (volumeRatio < 0.5) {
        reasons.push("🔇 Düşük hacim - Zayıf sinyal");
      }
    }

    // 6. CANDLESTICK PATTERNS
    if (i >= 2) {
      const prevCandle = candles[i - 1];
      const bodySize = Math.abs(candle.close - candle.open);
      const prevBodySize = Math.abs(prevCandle.close - prevCandle.open);

      // Bullish Engulfing
      if (
        prevCandle.close < prevCandle.open && // Önceki mum kırmızı
        candle.close > candle.open && // Bu mum yeşil
        candle.open < prevCandle.close &&
        candle.close > prevCandle.open &&
        bodySize > prevBodySize * 1.5
      ) {
        score += 2;
        reasons.push("🟢 Bullish Engulfing Pattern");
      }

      // Bearish Engulfing
      if (
        prevCandle.close > prevCandle.open && // Önceki mum yeşil
        candle.close < candle.open && // Bu mum kırmızı
        candle.open > prevCandle.close &&
        candle.close < prevCandle.open &&
        bodySize > prevBodySize * 1.5
      ) {
        score -= 2;
        reasons.push("🔴 Bearish Engulfing Pattern");
      }

      // Hammer (Alım Dönüş Sinyali)
      const lowerWick = candle.open > candle.close
        ? candle.close - candle.low
        : candle.open - candle.low;
      const upperWick = candle.open > candle.close
        ? candle.high - candle.open
        : candle.high - candle.close;

      if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.3 && candle.close < candle.open) {
        score += 2;
        reasons.push("🔨 Hammer Pattern - Alım dönüşü");
      }

      // Shooting Star (Satım Dönüş Sinyali)
      if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.3 && candle.close > candle.open) {
        score -= 2;
        reasons.push("⭐ Shooting Star - Satım dönüşü");
      }
    }

    // SİNYAL BELİRLE ve GÜÇ HESAPLA
    let signal: SwingSignal;
    let strength: number;

    if (score >= 7) {
      signal = "GÜÇLÜ AL";
      strength = Math.min(100, 70 + (score - 7) * 5);
    } else if (score >= 3) {
      signal = "AL";
      strength = 50 + (score - 3) * 5;
    } else if (score <= -7) {
      signal = "GÜÇLÜ SAT";
      strength = Math.min(100, 70 + Math.abs(score + 7) * 5);
    } else if (score <= -3) {
      signal = "SAT";
      strength = 50 + Math.abs(score + 3) * 5;
    } else {
      signal = "NÖTR";
      strength = 30 + Math.abs(score) * 3;
    }

    return {
      ...candle,
      signal,
      strength,
      reasons,
    };
  });
}

/**
 * Multi-Timeframe Analiz
 * Farklı zaman dilimlerinden sinyalleri birleştirir
 */
export function multiTimeframeConfirmation(
  currentTF: SwingSignal,
  higherTF?: SwingSignal,
  lowerTF?: SwingSignal
): {
  confirmed: boolean;
  confidence: number; // 0-100
  explanation: string;
} {
  const signals = [currentTF, higherTF, lowerTF].filter(Boolean);

  const buySignals = signals.filter(s => s === "GÜÇLÜ AL" || s === "AL").length;
  const sellSignals = signals.filter(s => s === "GÜÇLÜ SAT" || s === "SAT").length;
  const total = signals.length;

  let confirmed = false;
  let confidence = 0;
  let explanation = "";

  // Tüm timeframe'ler uyumlu
  if (buySignals === total && total >= 2) {
    confirmed = true;
    confidence = 90;
    explanation = "Tüm zaman dilimleri alım sinyali veriyor - Çok güçlü onay";
  } else if (sellSignals === total && total >= 2) {
    confirmed = true;
    confidence = 90;
    explanation = "Tüm zaman dilimleri satım sinyali veriyor - Çok güçlü onay";
  }
  // Çoğunluk alım yönünde
  else if (buySignals > sellSignals && buySignals >= 2) {
    confirmed = true;
    confidence = 60 + (buySignals / total) * 20;
    explanation = `${buySignals}/${total} zaman dilimi alım yönünde`;
  }
  // Çoğunluk satım yönünde
  else if (sellSignals > buySignals && sellSignals >= 2) {
    confirmed = true;
    confidence = 60 + (sellSignals / total) * 20;
    explanation = `${sellSignals}/${total} zaman dilimi satım yönünde`;
  }
  // Karışık sinyaller
  else {
    confirmed = false;
    confidence = 30;
    explanation = "Zaman dilimleri arasında uyumsuzluk - Bekleme önerilir";
  }

  return { confirmed, confidence, explanation };
}
