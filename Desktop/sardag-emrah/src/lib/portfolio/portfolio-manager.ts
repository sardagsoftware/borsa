/**
 * PORTFOLIO TRACKER
 * Track user's trading positions and performance
 */

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  strategy?: string;
  confidence?: number;
  entryDate: number;
  exitDate?: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface Portfolio {
  positions: Position[];
  totalPnL: number;
  totalPnLPercent: number;
  openPositions: number;
  closedPositions: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  bestTrade: Position | null;
  worstTrade: Position | null;
  totalInvested: number;
  currentValue: number;
}

const STORAGE_KEY = 'sardag_portfolio';

/**
 * Get portfolio
 */
export function getPortfolio(): Position[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save portfolio
 */
function savePortfolio(positions: Position[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('[Portfolio] Save error:', error);
  }
}

/**
 * Add position
 */
export function addPosition(position: Omit<Position, 'id' | 'entryDate' | 'status' | 'pnl' | 'pnlPercent'>): string {
  const id = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newPosition: Position = {
    ...position,
    id,
    entryDate: Date.now(),
    status: 'OPEN',
  };

  const positions = getPortfolio();
  positions.push(newPosition);
  savePortfolio(positions);

  console.log('[Portfolio] Position added:', newPosition);
  return id;
}

/**
 * Close position
 */
export function closePosition(positionId: string, exitPrice: number): void {
  const positions = getPortfolio();
  const position = positions.find(p => p.id === positionId);

  if (!position) return;

  position.exitPrice = exitPrice;
  position.exitDate = Date.now();
  position.status = 'CLOSED';

  // Calculate PnL
  const priceDiff = position.side === 'LONG'
    ? exitPrice - position.entryPrice
    : position.entryPrice - exitPrice;

  position.pnl = priceDiff * position.quantity;
  position.pnlPercent = (priceDiff / position.entryPrice) * 100;

  savePortfolio(positions);
  console.log('[Portfolio] Position closed:', position);
}

/**
 * Update position (for current price)
 */
export function updatePosition(positionId: string, currentPrice: number): void {
  const positions = getPortfolio();
  const position = positions.find(p => p.id === positionId);

  if (!position || position.status === 'CLOSED') return;

  position.currentPrice = currentPrice;

  // Calculate unrealized PnL
  const priceDiff = position.side === 'LONG'
    ? currentPrice - position.entryPrice
    : position.entryPrice - currentPrice;

  position.pnl = priceDiff * position.quantity;
  position.pnlPercent = (priceDiff / position.entryPrice) * 100;

  savePortfolio(positions);
}

/**
 * Delete position
 */
export function deletePosition(positionId: string): void {
  let positions = getPortfolio();
  positions = positions.filter(p => p.id !== positionId);
  savePortfolio(positions);
}

/**
 * Get portfolio statistics
 */
export function getPortfolioStats(currentPrices: Record<string, number>): Portfolio {
  const positions = getPortfolio();

  // Update current prices for open positions
  positions.forEach(pos => {
    if (pos.status === 'OPEN' && currentPrices[pos.symbol]) {
      updatePosition(pos.id, currentPrices[pos.symbol]);
    }
  });

  const openPos = positions.filter(p => p.status === 'OPEN');
  const closedPos = positions.filter(p => p.status === 'CLOSED');

  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalInvested = positions.reduce((sum, p) => sum + (p.entryPrice * p.quantity), 0);
  const currentValue = totalInvested + totalPnL;

  const winning = closedPos.filter(p => (p.pnl || 0) > 0);
  const losing = closedPos.filter(p => (p.pnl || 0) < 0);

  const best = positions.reduce((best, curr) =>
    (curr.pnlPercent || 0) > (best?.pnlPercent || -Infinity) ? curr : best
  , null as Position | null);

  const worst = positions.reduce((worst, curr) =>
    (curr.pnlPercent || 0) < (worst?.pnlPercent || Infinity) ? curr : worst
  , null as Position | null);

  return {
    positions,
    totalPnL,
    totalPnLPercent: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
    openPositions: openPos.length,
    closedPositions: closedPos.length,
    winningTrades: winning.length,
    losingTrades: losing.length,
    winRate: closedPos.length > 0 ? (winning.length / closedPos.length) * 100 : 0,
    bestTrade: best,
    worstTrade: worst,
    totalInvested,
    currentValue,
  };
}
