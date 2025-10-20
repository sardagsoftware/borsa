/**
 * RISK CALCULATOR
 *
 * Calculate risk levels for crypto coins based on:
 * - Volatility (24h change %)
 * - Volume (24h volume relative to average)
 * - Price momentum
 * - Market cap rank
 *
 * Risk Levels:
 * - VERY_LOW: 0-20% (Green spectrum)
 * - LOW: 20-40% (Yellow-Green spectrum)
 * - MEDIUM: 40-60% (Yellow spectrum)
 * - HIGH: 60-80% (Orange spectrum)
 * - VERY_HIGH: 80-100% (Red spectrum)
 */

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface RiskScore {
  level: RiskLevel;
  score: number; // 0-100
  factors: {
    volatility: number; // 0-100
    volume: number; // 0-100
    momentum: number; // 0-100
    rank: number; // 0-100
  };
}

/**
 * Calculate risk score for a coin
 */
export function calculateRiskScore(coin: {
  changePercent24h: number;
  changePercent7d?: number;
  volume24h: number;
  price: number;
  rank?: number;
}): RiskScore {
  // 1. Volatility Risk (0-100)
  // High volatility = high risk
  const volatility = Math.abs(coin.changePercent24h);
  let volatilityScore = 0;
  if (volatility >= 50) volatilityScore = 100;
  else if (volatility >= 30) volatilityScore = 80;
  else if (volatility >= 20) volatilityScore = 60;
  else if (volatility >= 10) volatilityScore = 40;
  else if (volatility >= 5) volatilityScore = 20;
  else volatilityScore = 10;

  // 2. Volume Risk (0-100)
  // Low volume = high risk (harder to exit positions)
  const volumeMil = coin.volume24h / 1_000_000;
  let volumeScore = 0;
  if (volumeMil < 1) volumeScore = 80; // Very low volume = very risky
  else if (volumeMil < 10) volumeScore = 60;
  else if (volumeMil < 50) volumeScore = 40;
  else if (volumeMil < 100) volumeScore = 20;
  else volumeScore = 10; // High volume = low risk

  // 3. Momentum Risk (0-100)
  // Negative momentum = higher risk
  const momentum = coin.changePercent24h;
  let momentumScore = 0;
  if (momentum < -20) momentumScore = 100;
  else if (momentum < -10) momentumScore = 80;
  else if (momentum < -5) momentumScore = 60;
  else if (momentum < 0) momentumScore = 40;
  else if (momentum < 5) momentumScore = 20;
  else momentumScore = 10; // Strong positive momentum = lower risk

  // 4. Rank Risk (0-100)
  // Lower rank (bigger number) = higher risk
  let rankScore = 50; // Default if no rank
  if (coin.rank) {
    if (coin.rank <= 10) rankScore = 10; // Top 10 = very low risk
    else if (coin.rank <= 50) rankScore = 20;
    else if (coin.rank <= 100) rankScore = 30;
    else if (coin.rank <= 200) rankScore = 50;
    else if (coin.rank <= 500) rankScore = 70;
    else rankScore = 90; // >500 = very high risk
  }

  // Calculate weighted average
  // Volatility: 30%, Volume: 25%, Momentum: 30%, Rank: 15%
  const totalScore = Math.round(
    volatilityScore * 0.3 +
    volumeScore * 0.25 +
    momentumScore * 0.3 +
    rankScore * 0.15
  );

  // Determine risk level
  let level: RiskLevel;
  if (totalScore >= 80) level = 'VERY_HIGH';
  else if (totalScore >= 60) level = 'HIGH';
  else if (totalScore >= 40) level = 'MEDIUM';
  else if (totalScore >= 20) level = 'LOW';
  else level = 'VERY_LOW';

  return {
    level,
    score: totalScore,
    factors: {
      volatility: volatilityScore,
      volume: volumeScore,
      momentum: momentumScore,
      rank: rankScore,
    },
  };
}

/**
 * Get color palette for risk level
 * Palette changes based on scan count to prevent user mistakes
 */
export function getRiskColorPalette(scanCount: number): {
  VERY_LOW: string;
  LOW: string;
  MEDIUM: string;
  HIGH: string;
  VERY_HIGH: string;
} {
  // Rotate through 4 different color palettes
  const paletteIndex = scanCount % 4;

  const palettes = [
    // Palette 1: Green -> Yellow -> Red
    {
      VERY_LOW: 'border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/30',
      LOW: 'border-2 border-lime-500/80 shadow-lg shadow-lime-500/30',
      MEDIUM: 'border-2 border-yellow-500/80 shadow-lg shadow-yellow-500/30',
      HIGH: 'border-2 border-orange-500/80 shadow-lg shadow-orange-500/30',
      VERY_HIGH: 'border-2 border-red-500/80 shadow-lg shadow-red-500/30',
    },
    // Palette 2: Blue -> Purple -> Pink
    {
      VERY_LOW: 'border-2 border-cyan-500/80 shadow-lg shadow-cyan-500/30',
      LOW: 'border-2 border-blue-500/80 shadow-lg shadow-blue-500/30',
      MEDIUM: 'border-2 border-purple-500/80 shadow-lg shadow-purple-500/30',
      HIGH: 'border-2 border-fuchsia-500/80 shadow-lg shadow-fuchsia-500/30',
      VERY_HIGH: 'border-2 border-pink-500/80 shadow-lg shadow-pink-500/30',
    },
    // Palette 3: Teal -> Indigo -> Rose
    {
      VERY_LOW: 'border-2 border-teal-500/80 shadow-lg shadow-teal-500/30',
      LOW: 'border-2 border-sky-500/80 shadow-lg shadow-sky-500/30',
      MEDIUM: 'border-2 border-indigo-500/80 shadow-lg shadow-indigo-500/30',
      HIGH: 'border-2 border-rose-500/80 shadow-lg shadow-rose-500/30',
      VERY_HIGH: 'border-2 border-red-600/80 shadow-lg shadow-red-600/30',
    },
    // Palette 4: Mint -> Amber -> Crimson
    {
      VERY_LOW: 'border-2 border-green-400/80 shadow-lg shadow-green-400/30',
      LOW: 'border-2 border-yellow-400/80 shadow-lg shadow-yellow-400/30',
      MEDIUM: 'border-2 border-amber-500/80 shadow-lg shadow-amber-500/30',
      HIGH: 'border-2 border-orange-600/80 shadow-lg shadow-orange-600/30',
      VERY_HIGH: 'border-2 border-red-700/80 shadow-lg shadow-red-700/30',
    },
  ];

  return palettes[paletteIndex];
}

/**
 * Get risk badge emoji
 */
export function getRiskEmoji(level: RiskLevel): string {
  switch (level) {
    case 'VERY_LOW': return '🛡️'; // Shield
    case 'LOW': return '✅'; // Check
    case 'MEDIUM': return '⚠️'; // Warning
    case 'HIGH': return '🔥'; // Fire
    case 'VERY_HIGH': return '☠️'; // Skull
  }
}

/**
 * Get risk text (Turkish)
 */
export function getRiskText(level: RiskLevel): string {
  switch (level) {
    case 'VERY_LOW': return 'Çok Düşük Risk';
    case 'LOW': return 'Düşük Risk';
    case 'MEDIUM': return 'Orta Risk';
    case 'HIGH': return 'Yüksek Risk';
    case 'VERY_HIGH': return 'Çok Yüksek Risk';
  }
}
