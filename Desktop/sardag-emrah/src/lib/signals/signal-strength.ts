/**
 * SIGNAL STRENGTH CALCULATOR
 *
 * Stratejilere göre sinyal gücü analizi
 * - Multiple strategy signals = STRONG_BUY
 * - Single strong signal = BUY
 * - Weak signals = NEUTRAL
 * - Negative signals = SELL
 */

export type SignalStrength = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface SignalAnalysis {
  strength: SignalStrength;
  score: number; // 0-100
  strategies: string[]; // Active strategies
  confidence: number; // 0-100
  color: string; // Border color
  badge: string | null; // Badge text (null if not BUY/STRONG_BUY)
}

export interface StrategySignal {
  name: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  confidence: number; // 0-100
}

/**
 * Calculate signal strength from multiple strategies
 */
export function calculateSignalStrength(signals: StrategySignal[]): SignalAnalysis {
  if (!signals || signals.length === 0) {
    return {
      strength: 'NEUTRAL',
      score: 50,
      strategies: [],
      confidence: 0,
      color: 'gray',
      badge: null,
    };
  }

  // Count buy/sell signals
  const buySignals = signals.filter(s => s.signal === 'BUY');
  const sellSignals = signals.filter(s => s.signal === 'SELL');

  // Calculate average strength and confidence
  const avgStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  // Calculate score (0-100)
  const buyCount = buySignals.length;
  const sellCount = sellSignals.length;
  const totalCount = signals.length;

  const buyRatio = buyCount / totalCount;
  const sellRatio = sellCount / totalCount;

  let score = 50; // Neutral baseline

  if (buyCount > sellCount) {
    // More buy signals
    score = 50 + (buyRatio * 50);
  } else if (sellCount > buyCount) {
    // More sell signals
    score = 50 - (sellRatio * 50);
  }

  // Adjust by average strength
  score = (score * 0.7) + (avgStrength * 0.3);

  // Determine strength level
  let strength: SignalStrength;
  let color: string;
  let badge: string | null = null;

  if (score >= 80 && buyCount >= 3) {
    strength = 'STRONG_BUY';
    color = 'emerald'; // Strong green
    badge = 'STRONG BUY';
  } else if (score >= 65 && buyCount >= 2) {
    strength = 'BUY';
    color = 'blue'; // Blue
    badge = 'BUY';
  } else if (score >= 45 && score <= 55) {
    strength = 'NEUTRAL';
    color = 'gray';
    badge = null;
  } else if (score <= 35 && sellCount >= 2) {
    strength = 'SELL';
    color = 'orange';
    badge = null; // Don't show SELL badge
  } else if (score <= 20 && sellCount >= 3) {
    strength = 'STRONG_SELL';
    color = 'red';
    badge = null; // Don't show STRONG_SELL badge
  } else {
    strength = 'NEUTRAL';
    color = 'gray';
    badge = null;
  }

  return {
    strength,
    score: Math.round(score),
    strategies: buySignals.map(s => s.name),
    confidence: Math.round(avgConfidence),
    color,
    badge,
  };
}

/**
 * Convert scanner signals to strategy signals
 */
export function convertScannerSignals(scannerSignals: any[]): StrategySignal[] {
  if (!scannerSignals || scannerSignals.length === 0) {
    return [];
  }

  return scannerSignals.map(signal => ({
    name: signal.strategy || signal.name || 'Unknown',
    signal: signal.signal || 'NEUTRAL',
    strength: signal.strength || 50,
    confidence: signal.confidence || 50,
  }));
}

/**
 * Get color classes for Tailwind
 */
export function getColorClasses(color: string): {
  border: string;
  glow: string;
  badge: string;
  text: string;
} {
  const colorMap: Record<string, any> = {
    emerald: {
      border: 'border-emerald-500',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
      text: 'text-emerald-400',
    },
    blue: {
      border: 'border-blue-500',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500',
      text: 'text-blue-400',
    },
    gray: {
      border: 'border-white/10',
      glow: '',
      badge: 'bg-gray-500/20 text-gray-400 border-gray-500',
      text: 'text-gray-400',
    },
    orange: {
      border: 'border-orange-500',
      glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]',
      badge: 'bg-orange-500/20 text-orange-400 border-orange-500',
      text: 'text-orange-400',
    },
    red: {
      border: 'border-red-500',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      badge: 'bg-red-500/20 text-red-400 border-red-500',
      text: 'text-red-400',
    },
  };

  return colorMap[color] || colorMap.gray;
}

/**
 * Check if signal should trigger notification
 */
export function shouldNotify(analysis: SignalAnalysis, previousAnalysis?: SignalAnalysis): boolean {
  // Notify only on STRONG_BUY or BUY
  if (analysis.strength !== 'STRONG_BUY' && analysis.strength !== 'BUY') {
    return false;
  }

  // If no previous analysis, notify
  if (!previousAnalysis) {
    return true;
  }

  // Notify if strength upgraded (e.g., BUY -> STRONG_BUY)
  if (analysis.score > previousAnalysis.score + 10) {
    return true;
  }

  // Don't notify if same or weaker
  return false;
}
