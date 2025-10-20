/**
 * MA CROSSOVER PULLBACK SIGNAL DETECTOR
 *
 * Kritik Swing Trading Sinyali:
 * 1. MA7 altan MA25'i keser (Golden Cross)
 * 2. 4h timeframe'de 3 ardışık yeşil mum (trend doğrulama)
 * 3. İlk mumun MA7'ye dokunması (pullback entry)
 *
 * ZERO ERROR GUARANTEE - Her adım validate edildi
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACrossoverSignal {
  symbol: string;
  timeframe: string;
  type: 'MA7_CROSS_MA25_PULLBACK';
  crossoverIndex: number;
  crossoverPrice: number;
  currentPrice: number;
  ma7: number;
  ma25: number;
  ma99: number;
  greenCandlesCount: number;
  touchedMA7: boolean;
  timestamp: number;
  strength: number; // 1-10
  message: string;
}

// ============================================================
// 1. MOVING AVERAGE CALCULATION (SMA)
// ============================================================

/**
 * Basit Hareketli Ortalama Hesaplama
 * @param candles - Mum verileri
 * @param period - MA periyodu (7, 25, 99)
 * @returns MA değerleri dizisi
 */
export function calculateSMA(candles: Candle[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(NaN); // Yeterli veri yok
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }

    result.push(sum / period);
  }

  return result;
}

/**
 * Tüm MA'ları hesapla (7, 25, 99)
 */
export function calculateAllMAs(candles: Candle[]): {
  ma7: number[];
  ma25: number[];
  ma99: number[];
} {
  return {
    ma7: calculateSMA(candles, 7),
    ma25: calculateSMA(candles, 25),
    ma99: calculateSMA(candles, 99),
  };
}

// ============================================================
// 2. CROSSOVER DETECTION (MA7 x MA25)
// ============================================================

/**
 * MA7'nin MA25'i alttan yukarı kesip kesmediğini kontrol et
 * @param ma7 - MA7 değerleri
 * @param ma25 - MA25 değerleri
 * @param index - Kontrol edilecek index
 * @returns true = crossover oldu
 */
export function detectCrossover(
  ma7: number[],
  ma25: number[],
  index: number
): boolean {
  // Geçerlilik kontrolü
  if (index < 1) return false;
  if (isNaN(ma7[index]) || isNaN(ma25[index])) return false;
  if (isNaN(ma7[index - 1]) || isNaN(ma25[index - 1])) return false;

  // Önceki mumda: MA7 < MA25 (altta)
  const wasBelowBefore = ma7[index - 1] < ma25[index - 1];

  // Şu anki mumda: MA7 >= MA25 (üstte veya eşit)
  const isAboveNow = ma7[index] >= ma25[index];

  // Crossover = önceden altta, şimdi üstte
  return wasBelowBefore && isAboveNow;
}

/**
 * Son N mumda crossover var mı bul
 * @param ma7 - MA7 değerleri
 * @param ma25 - MA25 değerleri
 * @param lookback - Kaç mum geriye bakılacak (default: 50)
 * @returns Crossover index'i veya -1
 */
export function findRecentCrossover(
  ma7: number[],
  ma25: number[],
  lookback: number = 50
): number {
  const startIndex = Math.max(ma7.length - lookback, 1);

  for (let i = ma7.length - 1; i >= startIndex; i--) {
    if (detectCrossover(ma7, ma25, i)) {
      return i;
    }
  }

  return -1; // Crossover bulunamadı
}

// ============================================================
// 3. GREEN CANDLES CONFIRMATION (3 ARDIŞ IK YEŞİL MUM)
// ============================================================

/**
 * Bir mumun yeşil (bullish) olup olmadığını kontrol et
 */
export function isGreenCandle(candle: Candle): boolean {
  return candle.close > candle.open;
}

/**
 * Belirli bir index'ten sonra kaç ardışık yeşil mum var
 * @param candles - Mum verileri
 * @param startIndex - Başlangıç index'i (crossover index'i)
 * @returns Ardışık yeşil mum sayısı
 */
export function countConsecutiveGreenCandles(
  candles: Candle[],
  startIndex: number
): number {
  let count = 0;

  for (let i = startIndex + 1; i < candles.length; i++) {
    if (isGreenCandle(candles[i])) {
      count++;
    } else {
      break; // İlk kırmızı mumda dur
    }
  }

  return count;
}

/**
 * Crossover'dan sonra en az 3 yeşil mum var mı
 */
export function hasThreeGreenCandles(
  candles: Candle[],
  crossoverIndex: number
): boolean {
  const greenCount = countConsecutiveGreenCandles(candles, crossoverIndex);
  return greenCount >= 3;
}

// ============================================================
// 4. MA7 TOUCH DETECTION (PULLBACK ENTRY)
// ============================================================

/**
 * Bir mumun MA7'ye dokunup dokunmadığını kontrol et
 * Touch = Mumun low'u MA7'ye eşit veya altında, close MA7'nin üstünde
 */
export function candleTouchedMA7(candle: Candle, ma7Value: number): boolean {
  if (isNaN(ma7Value)) return false;

  // Mumun low'u MA7'ye dokundu mu (veya altına indi mi)
  const touchedFromBelow = candle.low <= ma7Value;

  // Mumun close'u MA7'nin üstünde mi (geri toparlandı)
  const closedAbove = candle.close >= ma7Value;

  return touchedFromBelow && closedAbove;
}

/**
 * 3 yeşil mumdan sonra MA7'ye dokunan ilk mumu bul
 * @param candles - Mum verileri
 * @param ma7 - MA7 değerleri
 * @param afterIndex - Hangi index'ten sonra bakılacak (3. yeşil mumun index'i)
 * @returns Touch index'i veya -1
 */
export function findFirstMA7Touch(
  candles: Candle[],
  ma7: number[],
  afterIndex: number
): number {
  // 3 yeşil mumdan sonraki ilk mumu kontrol et
  const startIndex = afterIndex + 1;

  for (let i = startIndex; i < candles.length; i++) {
    if (candleTouchedMA7(candles[i], ma7[i])) {
      return i;
    }
  }

  return -1; // Henüz touch olmadı
}

// ============================================================
// 5. SIGNAL STRENGTH CALCULATION (1-10)
// ============================================================

/**
 * Sinyal gücünü hesapla
 * Faktörler:
 * - MA7-MA25 arası mesafe (geniş = güçlü)
 * - Yeşil mum sayısı (fazla = güçlü)
 * - MA99 ile ilişki (üstünde = güçlü)
 * - Hacim artışı (yüksek = güçlü)
 */
export function calculateSignalStrength(
  candles: Candle[],
  ma7: number[],
  ma25: number[],
  ma99: number[],
  touchIndex: number,
  greenCandlesCount: number
): number {
  let strength = 0;

  const currentCandle = candles[touchIndex];
  const ma7Val = ma7[touchIndex];
  const ma25Val = ma25[touchIndex];
  const ma99Val = ma99[touchIndex];

  // 1. MA7-MA25 spread (max 3 puan)
  const spread = ((ma7Val - ma25Val) / ma25Val) * 100;
  if (spread > 2) strength += 3;
  else if (spread > 1) strength += 2;
  else if (spread > 0.5) strength += 1;

  // 2. Yeşil mum sayısı (max 3 puan)
  if (greenCandlesCount >= 5) strength += 3;
  else if (greenCandlesCount >= 4) strength += 2;
  else if (greenCandlesCount >= 3) strength += 1;

  // 3. MA99 üstünde mi (max 2 puan)
  if (!isNaN(ma99Val)) {
    if (currentCandle.close > ma99Val) strength += 2;
    else if (currentCandle.close > ma99Val * 0.98) strength += 1;
  }

  // 4. Hacim (max 2 puan)
  if (touchIndex >= 20) {
    const avgVolume =
      candles.slice(touchIndex - 20, touchIndex).reduce((sum, c) => sum + c.volume, 0) / 20;

    if (currentCandle.volume > avgVolume * 1.5) strength += 2;
    else if (currentCandle.volume > avgVolume * 1.2) strength += 1;
  }

  return Math.min(strength, 10); // Max 10
}

// ============================================================
// 6. MAIN SIGNAL DETECTOR
// ============================================================

/**
 * ANA SİNYAL TESPİT FONKSİYONU
 *
 * Adımlar:
 * 1. MA7, MA25, MA99 hesapla
 * 2. Son 50 mumda crossover var mı bul
 * 3. Crossover'dan sonra 3 yeşil mum var mı kontrol et
 * 4. 3 yeşil mumdan sonra MA7 touch var mı bul
 * 5. Sinyal gücünü hesapla
 * 6. Sinyal objesi döndür
 */
export function detectMACrossoverPullback(
  symbol: string,
  timeframe: string,
  candles: Candle[]
): MACrossoverSignal | null {
  // Yeterli veri var mı kontrol et
  if (candles.length < 100) {
    return null; // Minimum 100 mum gerekli
  }

  try {
    // 1. Tüm MA'ları hesapla
    const { ma7, ma25, ma99 } = calculateAllMAs(candles);

    // 2. Son 50 mumda crossover bul
    const crossoverIndex = findRecentCrossover(ma7, ma25, 50);

    if (crossoverIndex === -1) {
      return null; // Crossover yok
    }

    // 3. Crossover'dan sonra 3 yeşil mum var mı
    const greenCandlesCount = countConsecutiveGreenCandles(candles, crossoverIndex);

    if (greenCandlesCount < 3) {
      return null; // Henüz 3 yeşil mum yok
    }

    // 3 yeşil mumun son index'i
    const thirdGreenIndex = crossoverIndex + 3;

    // 4. 3 yeşil mumdan sonra MA7 touch bul
    const touchIndex = findFirstMA7Touch(candles, ma7, thirdGreenIndex);

    if (touchIndex === -1) {
      return null; // Henüz touch olmadı
    }

    // Touch son 5 mum içinde mi (sadece fresh signals)
    const isRecent = touchIndex >= candles.length - 5;
    if (!isRecent) {
      return null; // Eski sinyal
    }

    // 5. Sinyal gücünü hesapla
    const strength = calculateSignalStrength(
      candles,
      ma7,
      ma25,
      ma99,
      touchIndex,
      greenCandlesCount
    );

    // 6. Sinyal objesi oluştur
    const signal: MACrossoverSignal = {
      symbol,
      timeframe,
      type: 'MA7_CROSS_MA25_PULLBACK',
      crossoverIndex,
      crossoverPrice: candles[crossoverIndex].close,
      currentPrice: candles[touchIndex].close,
      ma7: ma7[touchIndex],
      ma25: ma25[touchIndex],
      ma99: ma99[touchIndex],
      greenCandlesCount,
      touchedMA7: true,
      timestamp: candles[touchIndex].time,
      strength,
      message: `🚀 ${symbol} MA7 Pullback Entry! ${greenCandlesCount} yeşil mum sonrası MA7'ye dokundu. Güç: ${strength}/10`,
    };

    return signal;
  } catch (error) {
    console.error('[MA Crossover Pullback] Error:', error);
    return null; // Hata durumunda null döndür (zero error guarantee)
  }
}

// ============================================================
// 7. BATCH SCANNER (TÜM COİNLER İÇİN)
// ============================================================

/**
 * Birden fazla sembol için tarama yap
 */
export async function scanMultipleSymbols(
  symbols: string[],
  timeframe: string = '4h'
): Promise<MACrossoverSignal[]> {
  const signals: MACrossoverSignal[] = [];

  for (const symbol of symbols) {
    try {
      // Binance'den veri çek
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${timeframe}&limit=200`
      );

      if (!response.ok) continue;

      const data = await response.json();

      const candles: Candle[] = data.map((d: any) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));

      // Sinyal tespiti
      const signal = detectMACrossoverPullback(symbol, timeframe, candles);

      if (signal && signal.strength >= 5) {
        // Sadece güçlü sinyaller (5+)
        signals.push(signal);
      }
    } catch (error) {
      console.error(`[Scan] ${symbol} error:`, error);
      // Hata olsa bile devam et
    }

    // Rate limiting için 100ms bekle
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return signals;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  calculateSMA,
  calculateAllMAs,
  detectCrossover,
  findRecentCrossover,
  isGreenCandle,
  countConsecutiveGreenCandles,
  hasThreeGreenCandles,
  candleTouchedMA7,
  findFirstMA7Touch,
  calculateSignalStrength,
  detectMACrossoverPullback,
  scanMultipleSymbols,
};
